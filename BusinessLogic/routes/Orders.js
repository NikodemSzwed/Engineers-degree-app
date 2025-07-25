const express = require('express');
const getAllowedMaps = require('../functions/getTokenData.js').getAllowedMaps;
const db = require('../database/db');
const { io, findObjectAndParents } = require('../server/server');
const { Op, col } = require('sequelize');
const router = express.Router();
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const models = require('../database/getModels.js')();
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
        let ParentEIDs = [req.body.ParentEID];

        if (await allowence(allowedMaps, ParentEIDs)) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
        }
        req.body.ETID = 2;
        delete req.body.EID;

        transaction = await db.transaction();
        const newElement = await MapsAndElements.create(removePKandFieldsNotInModel(req.body, MapsAndElements), {
            transaction,
        });
        req.body.EID = newElement.EID;
        const newOrder = await Orders.create(removePKandFieldsNotInModel(req.body, Orders), {
            transaction,
        });

        await transaction.commit();
        const order = {
            newOrder,
            newElement,
        };
        res.json(order);

        let elements = await findObjectAndParents(req.body.EID);
        elements.forEach(element => {
            element = element.dataValues;

            let type = 'newOrder';
            if (element.ETID == 1) {
                type = 'updateMapNewOrder';
            } else if (element.ETID == 3) {
                type = 'updateSectorNewOrder';
            }

            io.to('EID-' + element.EID).emit(type, order);
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: `Failed to create order: ${error}` });
    }
});

router.get('/by-eid/:eid', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        let EIDs = [req.params.eid];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
        }
        const order = await Orders.findAll({
            where: {
                EID: req.params.eid,
            },
            include: {
                model: MapsAndElements,
                as: 'EID_MapsAndElement',
                required: true,
            },
        });
        res.json(order);
    } catch (error) {
        console.log('🚀 ~ router.get ~ error:', error);
        res.status(404).json({ error: 'Order not found' });
    }
});

router.get('/', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        if (await allowence(allowedMaps, [])) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
        }

        const query = `
          WITH RECURSIVE MapElements AS (
            SELECT * FROM MapsAndElements WHERE EID IN (:maps)
            UNION ALL
            SELECT me.* FROM MapsAndElements me
            INNER JOIN MapElements ON me.ParentEID = MapElements.EID
          )
          SELECT Orders.*,me.name as name,mep.name as ParentEIDName FROM MapElements me
          INNER JOIN Orders USING(EID)
          INNER JOIN MapElements mep ON me.ParentEID = mep.EID
          WHERE (:startDate IS NULL OR deadline >= :startDate)
          AND (:endDate IS NULL OR deadline < :endDate);
        `;

        const rawData = await db.query(query, {
            replacements: {
                maps: allowedMaps,
                startDate: req.query.startDate || null,
                endDate: req.query.endDate || null,
            },
            type: db.QueryTypes.SELECT,
        });

        // let order = rawData.map((row) => Orders.build(row, { isNewRecord: false }));

        res.json(rawData);
    } catch (error) {
        res.status(404).json({ error: 'Order not found' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        // const orders = await Orders.findByPk(req.params.id, {
        //     where: {
        //         OID: req.params.id,
        //     },
        //     include: {
        //         model: MapsAndElements,
        //         as: 'EID_MapsAndElement',
        //         required: true,
        //     },
        // });
        const orders = await Orders.findByPk(req.params.id, {
            attributes: {
                include: [
                    'OID',
                    'EID',
                    'State',
                    'Priority',
                    'deadline',
                    [col('EID_MapsAndElement.Name'), 'name'],
                    [col('EID_MapsAndElement.ParentE.Name'), 'ParentEIDName'],
                ],
            },
            where: {
                OID: req.params.id,
            },
            include: {
                model: MapsAndElements,
                as: 'EID_MapsAndElement',
                attributes: [],
                duplicating: false,
                required: true,
                include: {
                    model: MapsAndElements,
                    as: 'ParentE',
                    attributes: [],
                    duplicating: false,
                },
            },
        });

        if (await allowence(allowedMaps, [orders.EID])) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
        }
        res.json(orders);
    } catch (error) {
        console.log('🚀 ~ router.get ~ error:', error);
        res.status(500).json({ error: 'Failed to retrieve orders by OID', msg: error });
    }
});

router.put('/:id', async (req, res) => {
    let transaction;
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        const order = await Orders.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        EIDFromOrder = [order.EID];

        if (await allowence(allowedMaps, EIDFromOrder)) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
        }
        transaction = await db.transaction();
        const updatedOrder = await Orders.update(req.body, {
            where: {
                OID: req.params.id,
            },
            transaction,
        });
        delete req.body.EID;
        const updatedMapsFromOrderUpdate = await MapsAndElements.update(req.body, {
            where: {
                EID: EIDFromOrder,
            },
            transaction,
        });
        await transaction.commit();
        res.json({
            updatedOrder,
            updatedMapsFromOrderUpdate,
        });

        let orderElement = await MapsAndElements.findByPk(order.EID);
        const fullOrder = {
            order,
            orderElement,
        };

        let elements = await findObjectAndParents(order.EID);
        elements.forEach(element => {
            element = element.dataValues;

            let type = 'updateOrder';
            if (element.ETID == 1) {
                type = 'updateMapUpdateOrder';
            } else if (element.ETID == 3) {
                type = 'updateSectorUpdateOrder';
            }

            io.to('EID-' + element.EID).emit(type, fullOrder);
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to update order', msg: error });
    }
});

router.delete('/:id', async (req, res) => {
    let transaction;
    try {
        transaction = await db.transaction();
        const order = await Orders.findByPk(req.params.id, { transaction });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);

        if (await allowence(allowedMaps, [order.EID])) {
            return res.status(403).json({ error: 'You are not allowed to check some or all of those elements' });
        }

        const orderElement = await MapsAndElements.findByPk(order.EID);

        let elements = await findObjectAndParents(order.EID);

        let x = await MapsAndElements.destroy({
            where: {
                EID: order.EID,
            },
            transaction,
        });
        await transaction.commit();
        res.status(204).json(x);

        const fullOrder = {
            order,
            orderElement,
        };

        elements.forEach(element => {
            element = element.dataValues;
            console.log('🚀 ~ element:', element);

            let type = 'deleteOrder';
            if (element.ETID == 1) {
                type = 'updateMapDeleteOrder';
            } else if (element.ETID == 3) {
                type = 'updateSectorDeleteOrder';
            }

            io.to('EID-' + element.EID).emit(type, fullOrder);
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log('🚀 ~ router.delete ~ error:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

module.exports = router;
