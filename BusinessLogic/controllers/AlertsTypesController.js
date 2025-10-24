const getModels = require('../database/getModels.js');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const db = require('../database/db');

const models = getModels();
const AlertsTypes = models.AlertsTypes;
const ATtoETAssignment = models.ATtoETAssignment;
const ElementsTypes = models.ElementsTypes;

function ensureAdmin(req, res) {
    if (!req.decodedToken?.admin) {
        res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });
        return false;
    }
    return true;
}

async function getAlertTypes(req, res) {
    try {
        const alertTypes = await AlertsTypes.findAll();
        return res.json(alertTypes);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać typów alertów', details: error.message });
    }
}

async function createAlertType(req, res) {
    if (!ensureAdmin(req, res)) return;

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

        return res.json(newAlertType);
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: 'Nie udało się utworzyć typu alertu', details: error.message });
    }
}

async function getAlertTypeById(req, res) {
    try {
        const alertType = await AlertsTypes.findOne({
            where: { AAID: req.params.id },
            include: [
                {
                    model: ElementsTypes,
                    through: { attributes: [] },
                },
            ],
        });
        return res.json(alertType);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać typu alertu', details: error.message });
    }
}

async function updateAlertType(req, res) {
    if (!ensureAdmin(req, res)) return;

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
        return res.json(updatedAlertType);
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: 'Nie udało się zaktualizować typu alertu', details: error.message });
    }
}

async function deleteAlertType(req, res) {
    if (!ensureAdmin(req, res)) return;

    try {
        const deletedCount = await AlertsTypes.destroy({
            where: { AAID: req.params.id },
        });

        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Nie znaleziono typu alertu' });
        }

        return res.status(204).end();
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się usunąć typu alertu', details: error.message });
    }
}

module.exports = {
    getAlertTypes,
    createAlertType,
    getAlertTypeById,
    updateAlertType,
    deleteAlertType,
};
