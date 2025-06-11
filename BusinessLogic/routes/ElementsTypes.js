const express = require('express');
const router = express.Router();
const models = require('../database/getModels.js')();
const ElementsTypes = models.ElementsTypes;

router.post('/', async (req, res) => {
    res.status(403).json({ error: 'It is forbidden to create element type' });
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
        res.status(404).json({ error: 'Element type not found', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    res.status(403).json({ error: 'It is forbidden to update element type' });
});

router.delete('/:id', async (req, res) => {
    res.status(403).json({ error: 'It is forbidden to delete element type' });
});

module.exports = router;
