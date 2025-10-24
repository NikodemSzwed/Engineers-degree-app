const { getAllowedMaps } = require('../functions/getTokenData.js');
const getModels = require('../database/getModels.js');
const db = require('../database/db');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');

const models = getModels();
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

async function createDelivery(req, res) {
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

        const newDelivery = await Deliveries.create(removePKandFieldsNotInModel(req.body, Deliveries), {
            transaction,
        });

        await transaction.commit();
        transaction = null;
        return res.json(newDelivery);
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: 'Nie udało się utworzyć dostawy', details: error.message });
    }
}

async function getDeliveryById(req, res) {
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
        return res.json(delivery);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać dostawy', details: error.message });
    }
}

async function updateDelivery(req, res) {
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
        transaction = null;
        return res.json(updatedDelivery);
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: 'Nie udało się edytować dostawy', details: error.message });
    }
}

async function deleteDelivery(req, res) {
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
        transaction = null;
        return res.status(204).end();
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: 'Nie udało się usunąć dostawy', details: error.message });
    }
}

module.exports = {
    createDelivery,
    getDeliveryById,
    updateDelivery,
    deleteDelivery,
};
