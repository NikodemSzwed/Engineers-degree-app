const express = require('express');
const router = express.Router();
const MapsAndElementsController = require('../controllers/MapsAndElementsController');

router.get('/', MapsAndElementsController.getMaps);
router.get('/sectors', MapsAndElementsController.getSectors);
router.get('/singleObject/:id', MapsAndElementsController.getSingleObject);
router.get('/:id', MapsAndElementsController.getMapWithChildren);
router.post('/', MapsAndElementsController.createMapElement);
router.put('/:id', MapsAndElementsController.updateMapElement);
router.delete('/:id', MapsAndElementsController.deleteMapElement);

module.exports = router;
