const getModels = require('../database/getModels.js');

const models = getModels();
const ElementsTypes = models.ElementsTypes;

async function createElementType(req, res) {
    return res.status(405).json({ error: 'Nie można dodawać typów elementów' });
}

async function getElementTypes(req, res) {
    try {
        const elementType = await ElementsTypes.findAll();
        return res.json(elementType);
    } catch (error) {
        return res.status(404).json({ error: 'Nie znaleziono typów elementów', details: error.message });
    }
}

async function getElementTypeById(req, res) {
    try {
        const elementType = await ElementsTypes.findAll({
            where: {
                ETID: req.params.id,
            },
        });
        return res.json(elementType);
    } catch (error) {
        return res.status(404).json({ error: 'Nie znaleziono typów elementów', details: error.message });
    }
}

async function updateElementType(req, res) {
    return res.status(405).json({ error: 'Nie można edytować typów elementów' });
}

async function deleteElementType(req, res) {
    return res.status(405).json({ error: 'Nie można usuwać typów elementów' });
}

module.exports = {
    createElementType,
    getElementTypes,
    getElementTypeById,
    updateElementType,
    deleteElementType,
};
