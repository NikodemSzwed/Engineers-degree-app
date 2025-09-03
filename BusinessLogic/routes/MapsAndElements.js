const express = require('express');
const getAllowedMaps = require('../functions/getTokenData.js').getAllowedMaps;
const router = express.Router();
const { Op } = require('sequelize');
const { io, findObjectAndParents } = require('../server/server');
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
        res.status(500).json({ error: 'Nie udało się pobrać map', details: error.message });
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
        res.status(500).json({ error: 'Nie udało się pobrać sektorów', details: error.message });
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
        res.status(500).json({ error: 'Nie udało się pobrać obiektu', details: error.message });
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
        res.status(500).json({ error: 'Nie udało się pobrać elementów', details: error.message });
    }
});

router.post('/', async (req, res) => {
    let transaction;
    try {
        if (req.body.ETID == 1 && !req.decodedToken.admin) {
            throw new Error('Nie masz uprawnień do tworzenia map');
        }

        if (req.body.ETID != 1 && !req.body.ParentEID) {
            throw new Error('Zła definicja elementu nadrzędnego - ParentEID jest wymagane');
        }

        transaction = await db.transaction();
        const newElement = await MapsAndElements.create(removePKandFieldsNotInModel(req.body, MapsAndElements), {
            transaction,
        });
        if (req.body.ETID == 1) {
            //dodanie domyślnych uprawnień do mapy dla Administratorów
            await MapsToGroupAssignment.create(
                {
                    GID: 1,
                    EID: newElement.EID,
                },
                { transaction }
            );
        }

        await transaction.commit();
        transaction = null;

        let elements = await findObjectAndParents(newElement.EID);
        elements.forEach(element => {
            element = element.dataValues;

            let type = 'newElement';
            if (newElement.EID != element.EID) {
                if (element.ETID == 1) {
                    type = 'updateMapNewElement';
                } else if (element.ETID == 3) {
                    type = 'updateSectorNewElement';
                }
            }

            io.to('EID-' + element.EID).emit(type, newElement);
        });

        res.status(201).json(newElement);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Nie udało się utworzyć elementu', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        let UID = req.decodedToken.UID;
        let EIDs = [req.params.id];
        const query = `
            WITH RECURSIVE MapElements AS (
                SELECT * FROM MapsAndElements WHERE EID IN (:EIDs)
                UNION
                SELECT me.* FROM MapsAndElements me
                INNER JOIN MapElements ON me.EID = MapElements.ParentEID
            )
            SELECT EID,allowed FROM MapElements m
            LEFT JOIN (SELECT distinct EID, true as allowed FROM MapElements m2
                    JOIN MapsToGroupAssignment USING(EID)
                    JOIN Groups g USING(GID)
                    JOIN Membership USING(GID)
                    JOIN Users USING(UID)
                    WHERE UID = :UID AND ETID = 1 AND allowMapEdit = true
            ) as a USING(EID)
            WHERE ETID = 1 AND allowed IS NULL
        `;

        const rawData = await db.query(query, {
            replacements: { EIDs: EIDs, UID: UID },
            type: db.QueryTypes.SELECT,
        });

        const allowence = rawData.map(row => MapsAndElements.build(row, { isNewRecord: false }));

        if (allowence.length > 0) {
            return res.status(403).json({ error: 'Nie masz uprawnień do edycji tej mapy lub jej elementów' });
        }
        if (!req.body.ETID || req.body.ETID == 1) delete req.body.ParentEID;
        delete req.body.ETID;

        let updatedElement = await MapsAndElements.update(removePKandFieldsNotInModel(req.body, MapsAndElements), {
            where: {
                EID: req.params.id,
            },
        });

        updatedElement = await MapsAndElements.findByPk(req.params.id);
        let elements = await findObjectAndParents(updatedElement.EID);
        elements.forEach(element => {
            element = element.dataValues;

            let type = 'updateElement';
            if (updatedElement.EID != element.EID) {
                if (element.ETID == 1) {
                    type = 'updateMapUpdateElement';
                } else if (element.ETID == 3) {
                    type = 'updateSectorUpdateElement';
                }
            }

            io.to('EID-' + element.EID).emit(type, updatedElement);
        });
        res.json(updatedElement);
    } catch (error) {
        res.status(500).json({ error: 'Nie udało się zaktualizować elementu', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
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
            return res.status(403).json({ error: 'Nie masz uprawnień do usunięcia tej mapy lub jej elementów' });
        }

        let deleteElement = await MapsAndElements.findByPk(req.params.id);
        if (!deleteElement) {
            return res.status(404).json({ error: 'Nie znaleziono elementu' });
        } else if (deleteElement.ETID == 1 && !req.decodedToken.admin) {
            return res.status(403).json({ error: 'Nie masz uprawnień do usuwania map' });
        }

        let otherMapExists = await MapsAndElements.count({
            where: {
                ETID: 1,
                EID: { [Op.not]: deleteElement.EID },
            },
        });
        if (otherMapExists == 0) {
            return res.status(403).json({ error: 'Nie można usunąć ostatniej mapy' });
        }

        let elements = await findObjectAndParents(deleteElement.EID);

        await MapsAndElements.destroy({
            where: {
                EID: req.params.id,
                [Op.or]: [{ ETID: { [Op.ne]: 1 } }, db.literal(req.decodedToken.admin ? 'true' : 'false')],
            },
        });

        elements.forEach(element => {
            element = element.dataValues;

            let type = 'deleteElement';

            if (deleteElement.EID != element.EID) {
                if (element.ETID == 1) {
                    type = 'updateMapDeleteElement';
                } else if (element.ETID == 3) {
                    type = 'updateSectorDeleteElement';
                }
            }

            io.to('EID-' + element.EID).emit(type, deleteElement);
        });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Nie udało się usunąć elementu', details: error.message });
    }
});

module.exports = router;
