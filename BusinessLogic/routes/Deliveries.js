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
            return res.status(404).json({ error: 'Nie znaleziono zlecenia' });
        }

        let EIDs = [order.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res
                .status(403)
                .json({ error: 'Nie masz uprawnień do tworzenia niektórych lub wszystkich elementów' });
        }

        const newDelivery = await Deliveries.create(removePKandFieldsNotInModel(req.body, Deliveries), { transaction });

        await transaction.commit();
        res.json(newDelivery);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Nie udało się utworzyć dostawy', details: error.message });
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
            return res.status(404).json({ error: 'Nie znaleziono dostawy' });
        }

        let EIDs = [order.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res
                .status(403)
                .json({ error: 'Nie masz uprawnień do sprawdzenia niektórych lub wszystkich elementów' });
        }

        const delivery = order.Deliveries[0];
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ error: 'Nie udało się pobrać dostawy', details: error.message });
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
            return res.status(404).json({ error: 'Nie znaleziono dostawy' });
        }

        let EIDs = [order.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res.status(403).json({ error: 'Nie masz uprawnień do edycji niektórych lub wszystkich elementów' });
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
        res.status(500).json({ error: 'Nie udało się edytować dostawy', details: error.message });
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
            return res.status(404).json({ error: 'Nie znaleziono dostawy' });
        }

        let EIDs = [order.EID];

        if (await allowence(allowedMaps, EIDs)) {
            return res
                .status(403)
                .json({ error: 'Nie masz uprawnień do usuwania niektórych lub wszystkich elementów' });
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
        res.status(500).json({ error: 'Nie udało się usunąć dostawy', details: error.message });
    }
});

module.exports = router;
