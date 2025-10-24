const express = require('express');
const router = express.Router();
const AlertsTypesController = require('../controllers/AlertsTypesController');

router.get('/', AlertsTypesController.getAlertTypes);
router.post('/', AlertsTypesController.createAlertType);
router.get('/:id', AlertsTypesController.getAlertTypeById);
router.put('/:id', AlertsTypesController.updateAlertType);
router.delete('/:id', AlertsTypesController.deleteAlertType);

module.exports = router;
