const express = require('express');
const router = express.Router();
const models = require('../database/getModels.js')();
const ElementsTypes = models.ElementsTypes;

router.post('/', async (req, res) => {
    res.status(405).json({ error: 'Nie można dodawać typów elementów' });
});

router.get('/', async (req, res) => {
    try {
        const elementType = await ElementsTypes.findAll();
        res.json(elementType);
    } catch (error) {
        res.status(404).json({ error: 'Nie znaleziono typów elementów', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const elementType = await ElementsTypes.findAll({
            where: {
                ETID: req.params.id,
            },
        });
        res.json(elementType);
    } catch (error) {
        res.status(404).json({ error: 'Nie znaleziono typów elementów', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    res.status(405).json({ error: 'Nie można edytować typów elementów' });
});

router.delete('/:id', async (req, res) => {
    res.status(405).json({ error: 'Nie można usuwać typów elementów' });
});

module.exports = router;
