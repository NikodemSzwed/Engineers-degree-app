const express = require('express');
const router = express.Router();
const OrdersController = require('../controllers/OrdersController');

router.post('/', OrdersController.createOrder);
router.get('/by-eid/:eid', OrdersController.getOrdersByEID);
router.get('/', OrdersController.getOrders);
router.get('/:id', OrdersController.getOrderById);
router.put('/:id', OrdersController.updateOrder);
router.delete('/:id', OrdersController.deleteOrder);

module.exports = router;
