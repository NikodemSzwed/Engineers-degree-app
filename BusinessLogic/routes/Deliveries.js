const express = require('express');
const getAllowedMaps = require('../functions/getTokenData.js').getAllowedMaps;
const router = express.Router();
const models = require('../database/getModels.js')();
const db = require('../database/db');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const Deliveries = models.Deliveries;
const Orders = models.Orders;
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
    let transaction;
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        transaction = await db.transaction();
        let order = await Orders.findByPk(req.body.OID, { transaction });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        let EIDs = [order.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'You are not allowed to create some or all of those elements' });
        }

        const newDelivery = await Deliveries.create(removePKandFieldsNotInModel(req.body, Deliveries), { transaction });

        await transaction.commit();
        res.json(newDelivery);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to create delivery', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        let order = await Orders.findOne({
            attributes: ['EID'],
            include: {
                model: Deliveries,
                required: true,
                where: {
                    DelivID: req.params.id,
                },
            },
        });
        if (!order) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        let EIDs = [order.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'You are not allowed to create some or all of those elements' });
        }

        const delivery = order.Deliveries[0];
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve delivery', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    let transaction;
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        transaction = await db.transaction();
        let order = await Orders.findOne({
            attributes: ['EID'],
            include: {
                model: Deliveries,
                required: true,
                where: {
                    DelivID: req.params.id,
                },
            },
            transaction,
        });
        if (!order) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        let EIDs = [order.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'You are not allowed to create some or all of those elements' });
        }
        delete req.body.OID;
        let updatedDelivery = await Deliveries.update(removePKandFieldsNotInModel(req.body, Deliveries), {
            where: {
                DelivID: req.params.id,
            },
            transaction,
        });

        await transaction.commit();
        res.json(updatedDelivery);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to update delivery', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    let transaction;
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        transaction = await db.transaction();
        let order = await Orders.findOne({
            attributes: ['EID'],
            include: {
                model: Deliveries,
                required: true,
                where: {
                    DelivID: req.params.id,
                },
            },
            transaction,
        });
        if (!order) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        let EIDs = [order.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'You are not allowed to create some or all of those elements' });
        }

        await Deliveries.destroy({
            where: {
                DelivID: req.params.id,
            },
            transaction,
        });

        await transaction.commit();
        res.status(204).end();
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to delete delivery', details: error.message });
    }
});

module.exports = router;
