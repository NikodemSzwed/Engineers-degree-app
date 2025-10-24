const express = require('express');
const router = express.Router();
const GroupsController = require('../controllers/GroupsController');

router.get('/', GroupsController.getGroups);
router.post('/', GroupsController.createGroup);
router.get('/:id', GroupsController.getGroupById);
router.put('/:id', GroupsController.updateGroup);
router.delete('/:id', GroupsController.deleteGroup);

module.exports = router;
