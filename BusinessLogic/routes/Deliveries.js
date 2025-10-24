const express = require('express');
const router = express.Router();
const DeliveriesController = require('../controllers/DeliveriesController');

router.post('/', DeliveriesController.createDelivery);
router.get('/:id', DeliveriesController.getDeliveryById);
router.put('/:id', DeliveriesController.updateDelivery);
router.delete('/:id', DeliveriesController.deleteDelivery);

module.exports = router;
