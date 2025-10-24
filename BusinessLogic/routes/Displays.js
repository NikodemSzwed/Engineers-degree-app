const express = require('express');
const router = express.Router();
const DisplaysController = require('../controllers/DisplaysController');

router.get('/', DisplaysController.getDisplays);
router.post('/', DisplaysController.createDisplay);
router.post('/register', DisplaysController.registerDisplay);
router.post('/login', DisplaysController.loginDisplay);
router.get('/:id', DisplaysController.getDisplayById);
router.post('/remote/createAlert/:uuid', DisplaysController.remoteCreateAlert);
router.get('/remote/:uuid', DisplaysController.remoteGetDisplay);
router.put('/:id', DisplaysController.updateDisplay);
router.delete('/:id', DisplaysController.deleteDisplay);

module.exports = router;
