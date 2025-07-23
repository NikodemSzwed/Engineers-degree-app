const express = require('express');
const getAllowedMaps = require('../functions/getTokenData.js').getAllowedMaps;
const router = express.Router();
const { io } = require('../server/server');
const { Op, col } = require('sequelize');
const models = require('../database/getModels.js')();
const db = require('../database/db');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
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

router.post('/', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        let EIDs = [req.body.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
        }

        const newAlert = await Alerts.create(removePKandFieldsNotInModel(req.body, Alerts));
        res.status(201).json(newAlert);

        io.emit('newAlert', newAlert);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create alert', details: error.message });
    }
});

router.get('/', async (req, res) => {
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

        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alert', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
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
        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alert', details: error.message });
    }
});

router.get('/by-eid/:eid', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        let EIDs = [req.params.eid];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
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

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve alerts by EID', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        let alert = await Alerts.findByPk(req.params.id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        let EIDs = [alert.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
        }

        let alertCount = await Alerts.update(removePKandFieldsNotInModel(req.body, Alerts), {
            where: {
                AID: req.params.id,
            },
        });
        res.json(alertCount);
        alert = await Alerts.findByPk(req.params.id);

        io.emit('updateAlert', alert);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update alert', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        let alert = await Alerts.findByPk(req.params.id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        let EIDs = [alert.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
        }

        await Alerts.destroy({
            where: { AID: req.params.id },
        });

        res.status(204).end();
        io.emit('deleteAlert', alert);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete alert', details: error.message });
    }
});

module.exports = router;
