const express = require('express');
const getAllowedMaps = require('../functions/getTokenData.js').getAllowedMaps;
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../database/db');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const models = require('../database/getModels.js')();
const MapsAndElements = models.MapsAndElements;
const MapsToGroupAssignment = models.MapsToGroupAssignment;

router.get('/', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        const maps = await MapsAndElements.findAll({
            where: {
                ETID: 1,
                EID: { [Op.in]: allowedMaps },
            },
        });
        res.json(maps);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve maps', details: error.message });
    }
});

router.get('/sectors', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        const maps = await MapsAndElements.findAll({
            where: {
                ETID: 3,
                ParentEID: { [Op.in]: allowedMaps },
            },
        });
        res.json(maps);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve maps', details: error.message });
    }
});

router.get('/singleObject/:id', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        const maps = await MapsAndElements.findOne({
            where: {
                EID: req.params.id,
                [Op.or]: [
                    { EID: { [Op.in]: allowedMaps } },
                    {
                        ETID: 3,
                        ParentEID: { [Op.in]: allowedMaps },
                    },
                ],
            },
        });
        res.json(maps);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve maps', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        const query = `
          WITH RECURSIVE MapElements AS (
            SELECT * FROM MapsAndElements WHERE EID = :EID AND EID IN (:maps)
            UNION ALL
            SELECT me.* FROM MapsAndElements me
            INNER JOIN MapElements ON me.ParentEID = MapElements.EID
          )
          SELECT * FROM MapElements;
        `;

        const rawData = await db.query(query, {
            replacements: { EID: req.params.id, maps: allowedMaps },
            type: db.QueryTypes.SELECT,
        });

        const elements = rawData.map(row => MapsAndElements.build(row, { isNewRecord: false }));

        res.json(elements);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve map elements', details: error.message });
    }
});

router.post('/', async (req, res) => {
    let transaction;
    try {
        if (req.body.ETID == 1 && !req.decodedToken.admin) {
            throw new Error('You are not allowed to create maps');
        }

        if (req.body.ETID != 1 && !req.body.ParentEID) {
            throw new Error('Wrong definition of parent element - ParentEID is required');
        }

        transaction = await db.transaction();
        const element = await MapsAndElements.create(removePKandFieldsNotInModel(req.body, MapsAndElements), {
            transaction,
        });
        if (req.body.ETID == 1) {
            //dodanie domyślnych uprawnień do mapy dla Administratorów
            await MapsToGroupAssignment.create(
                {
                    GID: 1,
                    EID: element.EID,
                },
                { transaction }
            );
        }

        await transaction.commit();
        res.status(201).json(element);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to create element', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        let allowedMaps = getAllowedMaps(req.cookies['WarehouseLogisticsToken']);
        let EIDs = [req.params.id];
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

        if (allowence.length > 0) {
            return res.status(403).json({ error: 'You are not allowed to update some or all of those elements' });
        }

        //dodać blokowanie zamiany ETID oraz ParentEID dla ETID = 1
        let updatedElement = await MapsAndElements.update(removePKandFieldsNotInModel(req.body, MapsAndElements), {
            where: {
                EID: req.params.id,
            },
        });
        res.json(updatedElement);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update element', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await MapsAndElements.destroy({
            where: {
                EID: req.params.id,
                [Op.or]: [{ ETID: { [Op.ne]: 1 } }, db.literal(req.decodedToken.admin ? 'true' : 'false')],
            },
        });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete element', details: error.message });
    }
});

module.exports = router;
