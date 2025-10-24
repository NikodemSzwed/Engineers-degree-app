const { io, findObjectAndParents } = require('../server/server');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { Op } = require('sequelize');
const getModels = require('../database/getModels.js');

const models = getModels();
const Displays = models.Displays;
const DisplayElementsAssignment = models.DisplayElementsAssignment;
const MapsAndElements = models.MapsAndElements;
const Orders = models.Orders;
const Deliveries = models.Deliveries;
const Alerts = models.Alerts;
const AlertsTypes = models.AlertsTypes;
const ElementsTypes = models.ElementsTypes;

function ensureAdmin(req, res) {
    if (!req.decodedToken?.admin) {
        res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });
        return false;
    }
    return true;
}

async function getDisplays(req, res) {
    if (!ensureAdmin(req, res)) return;

    try {
        const displays = await Displays.findAll();
        return res.json(displays);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać monitorów', details: error.message });
    }
}

async function createDisplay(req, res) {
    if (!ensureAdmin(req, res)) return;

    let transaction;
    try {
        transaction = await db.transaction();
        const { EIDs } = req.body;
        const newDisplay = await Displays.create(removePKandFieldsNotInModel(req.body, Displays), {
            transaction,
        });

        if (!newDisplay) {
            throw new Error('Nie udało się utworzyć monitora');
        }

        if (EIDs && Array.isArray(EIDs)) {
            const assignmentEntries = EIDs.map(elementId => ({
                DID: newDisplay.DID,
                EID: elementId,
            }));

            await DisplayElementsAssignment.bulkCreate(assignmentEntries, { transaction });
        }

        await transaction.commit();
        transaction = null;

        return res.json(newDisplay);
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: 'Nie udało się utworzyć monitora', details: error.message });
    }
}

async function registerDisplay(req, res) {
    try {
        const newDisplay = await Displays.create({});
        return res.json({ UUID: newDisplay.UUID });
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się utworzyć monitora', details: error.message });
    }
}

async function loginDisplay(req, res) {
    try {
        const display = await Displays.findOne({
            where: {
                UUID: req.body.UUID,
            },
        });

        if (!display) {
            return res.status(401).json({ error: 'Display not found' });
        }

        const displayEIDs = await Displays.findOne({
            where: { UUID: req.body.UUID },
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
                },
            ],
        });

        const token = jwt.sign(
            {
                displayUUID: displayEIDs.UUID,
                displayEIDs: displayEIDs.DisplayElementsAssignments.map(element => element.EID),
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        res.cookie('WarehouseLogisticsToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 3600000,
        });

        return res.status(200).json({
            message: 'Monitor zalogował się',
        });
    } catch (error) {
        return res.status(401).json({ error: 'Nie udało się zalogować monitora', details: error.message });
    }
}

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
                ],
            },
        ],
    });

    let orders = display?.MapsAndElements?.flatMap(map => map.Orders) || [];
    if (!display)
        display = await Displays.findOne({
            where: {
                ...whereObject,
            },
        });
    display = display?.dataValues;

    if (display) {
        display['Orders'] = orders;
        display['MapsAndElements'] = displayElements.map(element => {
            return { ...element.dataValues };
        });
    }

    return display;
}

async function getDisplayById(req, res) {
    if (!ensureAdmin(req, res)) return;

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

        return res.json(display);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać danych monitora', details: error.message });
    }
}

async function remoteCreateAlert(req, res) {
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

        const rawData = await db.query(query, {
            replacements: {
                ID: req.params.uuid,
                EID: req.body.EID,
            },
            type: db.QueryTypes.SELECT,
        });
        const displayElements = rawData.map(row => MapsAndElements.build(row, { isNewRecord: false }));
        if (!displayElements.length) return res.status(404).json({ error: 'Nie znaleziono monitora lub elementu' });

        let alert = await Alerts.create({
            EID: req.body.EID,
            AAID: req.body.AAID,
        });
        alert = alert.dataValues;
        let alertElement = await MapsAndElements.findByPk(alert.EID);
        let alertType = await AlertsTypes.findByPk(alert.AAID);

        alert.AAName = alertType.dataValues.name;
        alert.EIDName = alertElement.dataValues.name;

        let elements = await findObjectAndParents(alert.EID);
        elements.forEach(element => {
            element = element.dataValues;
            io.to('EID-' + element.EID).emit('newAlert', { ...alert, roomEID: element.EID });
        });
        return res.json(alert);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać danych monitora', details: error.message });
    }
}

async function remoteGetDisplay(req, res) {
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

        return res.json(display);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to retrieve display', details: error.message });
    }
}

async function updateDisplay(req, res) {
    if (!ensureAdmin(req, res)) return;

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
        transaction = null;

        let displayUUID = await Displays.findOne({
            attributes: ['UUID'],
            where: {
                DID: req.params.id,
            },
        });

        io.to('display-' + displayUUID.dataValues.UUID).emit('updateDisplay', req.body);
        return res.json(updatedDisplay);
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: 'Nie udało się zaktualizować monitora', details: error.message });
    }
}

async function deleteDisplay(req, res) {
    if (!ensureAdmin(req, res)) return;

    try {
        let displayUUID = await Displays.findOne({
            attributes: ['UUID'],
            where: {
                DID: req.params.id,
            },
        });

        if (!displayUUID) return res.status(404).json({ error: 'Display not found' });

        await Displays.destroy({
            where: {
                DID: req.params.id,
            },
        });

        io.to('display-' + displayUUID.dataValues.UUID).emit('deleteDisplay');

        return res.status(204).end();
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się usunąć monitora', details: error.message });
    }
}

module.exports = {
    getDisplays,
    createDisplay,
    registerDisplay,
    loginDisplay,
    getDisplayById,
    remoteCreateAlert,
    remoteGetDisplay,
    updateDisplay,
    deleteDisplay,
};
