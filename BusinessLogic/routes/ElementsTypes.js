const express = require('express');
const router = express.Router();
const ElementsTypesController = require('../controllers/ElementsTypesController');

router.post('/', ElementsTypesController.createElementType);
router.get('/', ElementsTypesController.getElementTypes);
router.get('/:id', ElementsTypesController.getElementTypeById);
router.put('/:id', ElementsTypesController.updateElementType);
router.delete('/:id', ElementsTypesController.deleteElementType);

module.exports = router;
