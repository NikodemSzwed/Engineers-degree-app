const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/UsersController');

router.get('/', UsersController.getUsers);
router.post('/', UsersController.createUser);
router.post('/login', UsersController.loginUser);
router.post('/refresh', UsersController.refreshToken);
router.post('/logout', UsersController.logoutUser);
router.get('/:id', UsersController.getUserById);
router.put('/:id', UsersController.updateUser);
router.delete('/:id', UsersController.deleteUser);

module.exports = router;
