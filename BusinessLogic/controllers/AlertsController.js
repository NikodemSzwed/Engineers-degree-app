const { getAllowedMaps } = require('../functions/getTokenData.js');
const { io, findObjectAndParents } = require('../server/server');
const { Op, col } = require('sequelize');
const getModels = require('../database/getModels.js');
const db = require('../database/db');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');

const models = getModels();
const AlertsTypes = models.AlertsTypes;
const Alerts = models.Alerts;
const MapsAndElements = models.MapsAndElements;

async function allowence(allowedMaps, EIDs) {
    if (allowedMaps.length == 0) allowedMaps = [-1];
    if (EIDs.length == 0) EIDs = [-1];

    const query = `
        WITH RECURSIVE MapElements AS (
            SELECT * FROM MapsAndElements WHERE EID IN (:EIDs)
            UNION
            SELECT me.* FROM MapsAndElements me
            INNER JOIN MapElements ON me.EID = MapElements.ParentEID
        )
        SELECT EID FROM MapElements
        WHERE ETID = 1 AND EID NOT IN (:maps);
    `;

    const rawData = await db.query(query, {
        replacements: { EIDs: EIDs, maps: allowedMaps },
        type: db.QueryTypes.SELECT,
    });

    const allowence = rawData.map(row => MapsAndElements.build(row, { isNewRecord: false }));

    return allowence.length > 0;
}

async function createAlert(req, res) {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        let EIDs = [req.body.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res
                .status(403)
                .json({ error: 'Nie masz uprawnień do sprawdzenia niektórych lub wszystkich elementów' });
        }

        const newAlert = await Alerts.create(removePKandFieldsNotInModel(req.body, Alerts));

        let alertElement = await MapsAndElements.findByPk(newAlert.dataValues.EID);
        let alertType = await AlertsTypes.findByPk(newAlert.dataValues.AAID);

        newAlert.dataValues.AAName = alertType.dataValues.name;
        newAlert.dataValues.EIDName = alertElement.dataValues.name;

        let elements = await findObjectAndParents(newAlert.dataValues.EID);
        elements.forEach(element => {
            element = element.dataValues;
            io.to('EID-' + element.EID).emit('newAlert', { ...newAlert, roomEID: element.EID });
        });

        return res.status(201).json(newAlert);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się stworzyć alertu', details: error.message });
    }
}

async function getAlerts(req, res) {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        const query = `
                    WITH RECURSIVE MapElements AS (
                        SELECT * FROM MapsAndElements WHERE EID IN (:maps)
                        UNION ALL
                        SELECT me.* FROM MapsAndElements me
                        INNER JOIN MapElements ON me.ParentEID = MapElements.EID
                    )
                    SELECT EID FROM MapElements;
                `;

        const rawData = await db.query(query, {
            replacements: { EID: req.params.id, maps: allowedMaps },
            type: db.QueryTypes.SELECT,
        });

        const EIDs = rawData.map(row => MapsAndElements.build(row, { isNewRecord: false })).map(row => row.EID);
        const alert = await Alerts.findAll({
            attributes: {
                include: [
                    'AID',
                    'AAID',
                    'State',
                    'date',
                    [col('EID_MapsAndElement.Name'), 'EIDName'],
                    [col('AA_AlertsTypes.Name'), 'AAName'],
                ],
            },
            where: {
                [Op.and]: {
                    State: { [Op.in]: req.query.State || [0, 1, 2] },
                    date: {
                        [Op.gt]: new Date(req.query.afterDate || '1900-01-01'),
                        [Op.lt]: new Date(req.query.beforeDate || '3000-01-01'),
                    },
                    EID: { [Op.in]: EIDs },
                },
            },
            include: [
                {
                    model: MapsAndElements,
                    as: 'EID_MapsAndElement',
                    attributes: [],
                    duplicating: false,
                },
                {
                    model: AlertsTypes,
                    as: 'AA_AlertsTypes',
                    attributes: [],
                    duplicating: false,
                },
            ],
        });

        return res.json(alert);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać alertu', details: error.message });
    }
}

async function getAlertById(req, res) {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        const query = `
          WITH RECURSIVE MapElements AS (
            SELECT * FROM MapsAndElements WHERE EID IN (:maps)
            UNION ALL
            SELECT me.* FROM MapsAndElements me
            INNER JOIN MapElements ON me.ParentEID = MapElements.EID
          )
          SELECT Alerts.* FROM MapElements
          INNER JOIN Alerts USING(EID)
          WHERE AID = :AID;
        `;

        const rawData = await db.query(query, {
            replacements: { AID: req.params.id, maps: allowedMaps },
            type: db.QueryTypes.SELECT,
        });

        const AID = rawData.map(row => Alerts.build(row, { isNewRecord: false })).map(row => row.AID);
        let alert = await Alerts.findAll({
            attributes: {
                include: [
                    'AID',
                    'AAID',
                    'State',
                    'date',
                    [col('EID_MapsAndElement.Name'), 'EIDName'],
                    [col('AA_AlertsTypes.Name'), 'AAName'],
                ],
            },
            where: {
                AID: { [Op.in]: AID },
            },
            include: [
                {
                    model: MapsAndElements,
                    as: 'EID_MapsAndElement',
                    attributes: [],
                    duplicating: false,
                },
                {
                    model: AlertsTypes,
                    as: 'AA_AlertsTypes',
                    attributes: [],
                    duplicating: false,
                },
            ],
        });

        if (alert.length == 1) alert = alert[0];
        return res.json(alert);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać alertu', details: error.message });
    }
}

async function getAlertsByEID(req, res) {
    try {
        let EIDs = [req.params.eid];
        if (!req.decodedToken.displayUUID) {
            let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

            if (await allowence(allowedMaps, EIDs)) {
                return res
                    .status(403)
                    .json({ error: 'Nie masz uprawnień do sprawdzenia niektórych lub wszystkich elementów' });
            }
        }

        const alerts = await Alerts.findAll({
            where: {
                [Op.and]: {
                    State: { [Op.in]: req.body.State || [0, 1, 2] },
                    [Op.and]: {
                        date: { [Op.gt]: new Date(req.body.afterDate || '1900-01-01') },
                        date: { [Op.lt]: new Date(req.body.beforeDate || '3000-01-01') },
                    },
                    EID: { [Op.in]: EIDs },
                },
            },
        });

        return res.json(alerts);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać alertów po EID', details: error.message });
    }
}

async function updateAlert(req, res) {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        let alert = await Alerts.findByPk(req.params.id);
        if (!alert) {
            return res.status(404).json({ error: 'Nie znaleziono alertu' });
        }

        let EIDs = [alert.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res
                .status(403)
                .json({ error: 'Nie masz uprawnień do sprawdzenia niektórych lub wszystkich elementów' });
        }

        let alertCount = await Alerts.update(removePKandFieldsNotInModel(req.body, Alerts), {
            where: {
                AID: req.params.id,
            },
        });

        alert = await Alerts.findByPk(req.params.id);
        alert = alert.dataValues;
        let alertElement = await MapsAndElements.findByPk(alert.EID);
        let alertType = await AlertsTypes.findByPk(alert.AAID);

        alert.AAName = alertType.dataValues.name;
        alert.EIDName = alertElement.dataValues.name;

        let elements = await findObjectAndParents(alert.EID);
        elements.forEach(element => {
            element = element.dataValues;
            io.to('EID-' + element.EID).emit('updateAlert', { ...alert, roomEID: element.EID });
        });
        return res.json(alertCount);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się zedytować alertu', details: error.message });
    }
}

async function deleteAlert(req, res) {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        let alert = await Alerts.findByPk(req.params.id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        let EIDs = [alert.dataValues.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res
                .status(403)
                .json({ error: 'Nie masz uprawnień do sprawdzenia niektórych lub wszystkich elementów' });
        }

        await Alerts.destroy({
            where: { AID: req.params.id },
        });

        let elements = await findObjectAndParents(alert.dataValues.EID);
        elements.forEach(element => {
            element = element.dataValues;
            io.to('EID-' + element.EID).emit('deleteAlert', { ...alert.dataValues, roomEID: element.EID });
        });

        return res.status(204).end();
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się usunąć alertu', details: error.message });
    }
}

module.exports = {
    createAlert,
    getAlerts,
    getAlertById,
    getAlertsByEID,
    updateAlert,
    deleteAlert,
};
