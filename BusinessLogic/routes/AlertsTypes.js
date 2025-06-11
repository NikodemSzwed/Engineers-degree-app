const express = require('express');
const router = express.Router();
const models = require('../database/getModels.js')();
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const db = require('../database/db');
const AlertsTypes = models.AlertsTypes;
const ATtoETAssignment = models.ATtoETAssignment;
const ElementsTypes = models.ElementsTypes;

router.get('/', async (req, res) => {
    try {
        const alertTypes = await AlertsTypes.findAll();
        res.json(alertTypes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve alert types', details: error.message });
    }
});

router.post('/', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    let transaction;
    try {
        transaction = await db.transaction();
        const { ETIDs } = req.body;
        const newAlertType = await AlertsTypes.create(removePKandFieldsNotInModel(req.body, AlertsTypes), {
            transaction,
        });

        if (ETIDs && Array.isArray(ETIDs)) {
            const associationEntries = ETIDs.map(ETID => ({
                AAID: newAlertType.AAID,
                ETID,
            }));
            await ATtoETAssignment.bulkCreate(associationEntries, { transaction });
        }

        await transaction.commit();

        res.json(newAlertType);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to create alert type', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const alertType = await AlertsTypes.findAll({
            where: { AAID: req.params.id },
            include: [
                {
                    model: ElementsTypes,
                    through: { attributes: [] },
                },
            ],
        });
        res.json(alertType);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve alert type', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    let transaction;
    try {
        transaction = await db.transaction();
        const { ETIDs } = req.body;
        let updatedAlertType = await AlertsTypes.update(removePKandFieldsNotInModel(req.body, AlertsTypes), {
            where: {
                AAID: req.params.id,
            },
            transaction,
        });

        if (ETIDs && Array.isArray(ETIDs)) {
            updatedAlertType[0] = 1;
            await ATtoETAssignment.destroy({
                where: {
                    AAID: req.params.id,
                },
                transaction,
            });

            const associationEntries = ETIDs.map(ETID => ({
                AAID: req.params.id,
                ETID,
            }));
            await ATtoETAssignment.bulkCreate(associationEntries, { transaction });
        }

        await transaction.commit();
        res.json(updatedAlertType);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Failed to update alert type', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    try {
        const deletedCount = await AlertsTypes.destroy({
            where: { AAID: req.params.id },
        });

        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Alert Type not found' });
        }

        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete alert type', details: error.message });
    }
});

module.exports = router;
