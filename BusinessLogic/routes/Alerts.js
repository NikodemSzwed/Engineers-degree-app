const express = require('express');
const router = express.Router();
const AlertsController = require('../controllers/AlertsController');

router.post('/', AlertsController.createAlert);
router.get('/', AlertsController.getAlerts);
router.get('/by-eid/:eid', AlertsController.getAlertsByEID);
router.get('/:id', AlertsController.getAlertById);
router.put('/:id', AlertsController.updateAlert);
router.delete('/:id', AlertsController.deleteAlert);

module.exports = router;
