const express = require('express');
const router = express.Router();
const { io } = require('../server/server');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const db = require('../database/db');
const { Op } = require('sequelize');
const models = require('../database/getModels.js')();
const Displays = models.Displays;
const DisplayElementsAssignment = models.DisplayElementsAssignment;
const MapsAndElements = models.MapsAndElements;
const Orders = models.Orders;
const Deliveries = models.Deliveries;
const Alerts = models.Alerts;
const AlertsTypes = models.AlertsTypes;
const ElementsTypes = models.ElementsTypes;

router.get('/', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    try {
        const displays = await Displays.findAll();
        res.json(displays);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve displays', details: error.message });
    }
});

router.post('/', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    let transaction;
    try {
        transaction = await db.transaction();
        const { EIDs } = req.body;
        const newDisplay = await Displays.create(removePKandFieldsNotInModel(req.body, Displays), {
            transaction,
        });

        if (!newDisplay) {
            throw new Error('Failed to create display');
        }

        if (EIDs && Array.isArray(EIDs)) {
            const assignmentEntries = EIDs.map(elementId => ({
                DID: newDisplay.DID,
                EID: elementId,
            }));

            await DisplayElementsAssignment.bulkCreate(assignmentEntries, { transaction });
        }

        await transaction.commit();

        res.json(newDisplay);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to create display', details: error.message });
    }
});

//nie wymaga uprawnień
router.post('/register', async (req, res) => {
    try {
        const newDisplay = await Displays.create({});
        res.json({ UUID: newDisplay.UUID });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create display', details: error.message });
    }
});

async function dataGetter(query, id) {
    const rawData = await db.query(query, {
        replacements: { ID: id },
        type: db.QueryTypes.SELECT,
    });

    let whereObject = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)
        ? { UUID: id }
        : { DID: id };

    const displayElements = await Promise.all(
        rawData.map(async row => {
            const element = MapsAndElements.build(row, { isNewRecord: false });
            const alerts = await Alerts.findAll({
                where: {
                    EID: element.EID,
                    State: { [Op.in]: [0, 1] },
                },
            });
            element.dataValues.alerts = alerts;
            return element;
        })
    );

    let display = await Displays.findOne({
        where: {
            [Op.or]: [whereObject],
        },
        include: [
            {
                model: DisplayElementsAssignment,
                as: 'DisplayElementsAssignments',
                required: false,
                attributes: ['EID'],
            },
            {
                model: MapsAndElements,
                required: false,
                attributes: ['EID'],
                through: { attributes: [] },
                include: [
                    {
                        model: Orders,
                        required: false,
                        as: 'Orders',
                        include: [
                            {
                                model: Deliveries,
                                attributes: {
                                    exclude: ['OID'],
                                },
                                required: false,
                            },
                        ],
                    },
                    // {
                    //     model: Alerts,
                    //     required: false,
                    //     include: [
                    //         {
                    //             model: AlertsTypes,
                    //             as: 'AA_AlertsTypes',
                    //             attributes: ['name'],
                    //             required: false,
                    //         },
                    //     ],
                    // },
                ],
            },
        ],
    });

    let orders = display?.MapsAndElements?.flatMap(map => map.Orders) || [];
    // let alerts = display?.MapsAndElements?.flatMap(map => map.Alerts) || [];
    if (!display)
        display = await Displays.findOne({
            where: {
                ...whereObject,
            },
        });
    display = display?.dataValues;

    if (display) {
        display['Orders'] = orders;
        // display['Alerts'] = alerts;
        display['MapsAndElements'] = displayElements.map(element => {
            return { ...element.dataValues };
        });
    }

    return display;
}

router.get('/:id', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    try {
        const query = `
        WITH RECURSIVE MapElements AS (
            SELECT * FROM MapsAndElements WHERE EID IN (
                SELECT EID FROM DisplayElementsAssignment WHERE DID = :ID
            )
            UNION ALL
            SELECT me.* FROM MapsAndElements me
            INNER JOIN MapElements ON me.ParentEID = MapElements.EID
        )
        SELECT * FROM MapElements;
        `;

        let display = await dataGetter(query, req.params.id);

        res.json(display);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve display', details: error.message });
    }
});

//nie wymaga uprawnień
router.post('/remote/createAlert/:uuid', async (req, res) => {
    try {
        if (
            await Displays.findOne({
                where: {
                    UUID: req.params.uuid,
                    validated: 0,
                },
            })
        )
            return res.status(403).json({ error: 'Display not validated' });

        const query = `
        WITH RECURSIVE MapElements AS (
            SELECT * FROM MapsAndElements WHERE EID IN (
                SELECT dea.EID FROM Displays 
                INNER JOIN DisplayElementsAssignment dea ON Displays.DID = dea.DID
                WHERE UUID = :ID
            )
            UNION
            SELECT me.* FROM MapsAndElements me
            INNER JOIN MapElements ON me.ParentEID = MapElements.EID
        )
        SELECT * FROM MapElements
        WHERE EID = :EID;
        `;

        // let display = await dataGetter(query, req.params.uuid);
        const rawData = await db.query(query, {
            replacements: {
                ID: req.params.uuid,
                EID: req.body.EID,
            },
            type: db.QueryTypes.SELECT,
        });
        const displayElements = rawData.map(row => MapsAndElements.build(row, { isNewRecord: false }));
        if (!displayElements.length) return res.status(404).json({ error: 'Display or object not found' });

        let alert = await Alerts.create({
            EID: req.body.EID,
            AAID: req.body.AAID,
        });

        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve display', details: error.message });
    }
});

//nie wymaga uprawnień
router.get('/remote/:uuid', async (req, res) => {
    try {
        if (
            await Displays.findOne({
                where: {
                    UUID: req.params.uuid,
                    validated: 0,
                },
            })
        )
            return res.status(403).json({ error: 'Display not validated' });

        const query = `
        WITH RECURSIVE MapElements AS (
            SELECT * FROM MapsAndElements WHERE EID IN (
                SELECT dea.EID FROM Displays 
                INNER JOIN DisplayElementsAssignment dea ON Displays.DID = dea.DID
                WHERE UUID = :ID
            )
            UNION
            SELECT me.* FROM MapsAndElements me
            INNER JOIN MapElements ON me.ParentEID = MapElements.EID
        )
        SELECT * FROM MapElements;
        `;

        let display = await dataGetter(query, req.params.uuid);
        let alertTypes = await AlertsTypes.findAll({
            include: {
                model: ElementsTypes,
                required: false,
                attributes: ['ETID'],
                through: { attributes: [] },
            },
        });
        if (display) display['AlertsTypes'] = alertTypes;
        else return res.status(404).json({ error: 'Display not found' });

        res.json(display);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve display', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    let transaction;
    try {
        transaction = await db.transaction();
        const { EIDs } = req.body;
        let updatedDisplay = await Displays.update(removePKandFieldsNotInModel(req.body, Displays), {
            where: {
                DID: req.params.id,
            },
            transaction,
        });

        if (EIDs && Array.isArray(EIDs)) {
            updatedDisplay[0] = 1;
            await DisplayElementsAssignment.destroy({
                where: {
                    DID: req.params.id,
                },
                transaction,
            });

            const assignmentEntries = EIDs.map(elementId => ({
                DID: req.params.id,
                EID: elementId,
            }));

            await DisplayElementsAssignment.bulkCreate(assignmentEntries, { transaction });
        }

        await transaction.commit();
        res.json(updatedDisplay);

        let displayUUID = await Displays.findOne({
            attributes: ['UUID'],
            where: {
                DID: req.params.id,
            },
        });

        io.to('DID-' + req.params.id).emit('updateDisplay', req.body);
        io.to('UUID-' + displayUUID.dataValues.UUID).emit('updateDisplay', req.body);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to update display', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    try {
        let displayUUID = await Displays.findOne({
            attributes: ['UUID'],
            where: {
                DID: req.params.id,
            },
        });

        await Displays.destroy({
            where: {
                DID: req.params.id,
            },
        });
        res.status(204).end();

        io.to('DID-' + req.params.id).emit('deleteDisplay');
        io.to('UUID-' + displayUUID.dataValues.UUID).emit('deleteDisplay');
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete display', details: error.message });
    }
});

module.exports = router;
