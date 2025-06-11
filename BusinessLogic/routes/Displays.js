const express = require('express');
const router = express.Router();
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

    const displayElements = rawData.map(row => MapsAndElements.build(row, { isNewRecord: false }));
    let display = await Displays.findOne({
        where: {
            [Op.or]: [{ UUID: id }, { DID: id }],
        },
        include: [
            {
                model: DisplayElementsAssignment,
                as: 'DisplayElementsAssignments',
                required: true,
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
                    {
                        model: Alerts,
                        required: false,
                        include: [
                            {
                                model: AlertsTypes,
                                attributes: ['name'],
                                required: false,
                            },
                        ],
                    },
                ],
            },
        ],
    });

    let orders = display?.MapsAndElements?.flatMap(map => map.Orders) || [];
    let alerts = display?.MapsAndElements?.flatMap(map => map.Alerts) || [];
    display = display.dataValues;
    display['Orders'] = orders;
    display['Alerts'] = alerts;
    display['MapsAndElements'] = displayElements.map(element => {
        return { ...element.dataValues };
    });

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
router.get('/remote/:uuid', async (req, res) => {
    try {
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
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to update display', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    try {
        await Displays.destroy({
            where: {
                DID: req.params.id,
            },
        });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete display', details: error.message });
    }
});

module.exports = router;
