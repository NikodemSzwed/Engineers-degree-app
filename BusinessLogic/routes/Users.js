const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs/dist/bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const getTokenData = require('../functions/getTokenData.js').getTokenData;
const models = require('../database/getModels.js')();
const Users = models.Users;
const Groups = models.Groups;
const MapsAndElements = models.MapsAndElements;

router.get('/', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    try {
        const users = await Users.findAll({
            attributes: {
                exclude: ['passwd'],
            },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve users', details: error.message });
    }
});

router.post('/', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });
    const newLogin = req.body.login;
    const existingUser = await Users.findOne({
        where: { login: newLogin },
    });
    if (existingUser) return res.status(400).json({ error: `User with login '${newLogin}' already exists` });

    try {
        const HashPasswd = bcrypt.hashSync(req.body.passwd, 10);
        const newUser = await Users.create({
            login: req.body.login,
            email: req.body.email,
            passwd: HashPasswd,
            PersonalSettings_json: req.body.PersonalSettings_json,
        });

        res.json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await Users.findOne({
            where: {
                [Op.or]: [{ email: req.body.login || '' }, { login: req.body.login || '' }],
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid login or password' });
        }

        const isPasswordValid = bcrypt.compareSync(req.body.passwd, user.passwd);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid login or password' });
        }

        const userMaps = await MapsAndElements.findAll({
            attributes: ['EID'],
            include: [
                {
                    model: Groups,
                    required: true,
                    include: [
                        {
                            model: Users,
                            required: true,
                            where: { UID: user.UID },
                        },
                    ],
                    through: { attributes: [] },
                },
            ],
        });
        const userEIDs = userMaps.map(map => map.EID);

        const userGroups = await Groups.findAll({
            attributes: ['GID'],
            where: {
                GID: 1,
            },
            include: [
                {
                    model: Users,
                    required: true,
                    where: { UID: user.UID },
                },
            ],
            through: { attributes: [] },
        });

        const token = jwt.sign(
            {
                UID: user.UID,
                userEIDs,
                admin: userGroups.length > 0,
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        res.cookie('WarehouseLogisticsToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 3600000,
        });

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.UID,
                email: user.email,
                login: user.login,
                adminPrivileges: userGroups.length > 0,
                personalSettings: user.PersonalSettings_json,
            },
        });
    } catch (error) {
        res.status(401).json({ error: 'Logging error', details: error.message });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const token = req.cookies['WarehouseLogisticsToken'];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decodedToken = getTokenData(token);

        const userMaps = await MapsAndElements.findAll({
            attributes: ['EID'],
            include: [
                {
                    model: Groups,
                    required: true,
                    include: [
                        {
                            model: Users,
                            required: true,
                            where: { UID: decodedToken.UID },
                        },
                    ],
                    through: { attributes: [] },
                },
            ],
        });
        const userEIDs = userMaps.map(map => map.EID);

        const userGroups = await Groups.findAll({
            attributes: ['GID'],
            where: {
                GID: 1,
            },
            include: [
                {
                    model: Users,
                    required: true,
                    where: { UID: decodedToken.UID },
                },
            ],
            through: { attributes: [] },
        });

        const personalSettings = await Users.findOne({
            attributes: ['PersonalSettings_json'],
            where: { UID: decodedToken.UID },
        });

        const newtoken = jwt.sign(
            {
                UID: decodedToken.UID,
                userEIDs,
                admin: userGroups.length > 0,
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        res.clearCookie('WarehouseLogisticsToken');
        res.cookie('WarehouseLogisticsToken', newtoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 3600000,
        });

        return res.status(200).json({
            message: 'Token refreshed',
            adminPrivileges: decodedToken.admin,
            personalSettings: personalSettings.PersonalSettings_json,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify token', details: error.message });
    }
});

router.post('/logout', async (req, res) => {
    res.clearCookie('WarehouseLogisticsToken');
    res.status(200).json({ message: 'Logout successful' });
});

router.get('/:id', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    try {
        const user = await Users.findOne({
            attributes: {
                exclude: ['passwd'],
            },
            where: {
                UID: req.params.id,
            },
            include: [
                {
                    model: Groups,
                    required: false,
                    through: { attributes: [] },
                },
            ],
        });
        res.json(user);
    } catch (error) {
        res.status(404).json({ error: 'User not found', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    if (!req.decodedToken.admin && req.decodedToken.UID != req.params.id)
        return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    try {
        let data = removePKandFieldsNotInModel(req.body, Users);

        if (!req.decodedToken.admin && req.decodedToken.UID == req.params.id && data.login) {
            return res.status(403).json({ error: 'Unauthorized: Admin privileges required to change login' });
        }

        if (data.passwd) data.passwd = bcrypt.hashSync(data.passwd, 10);
        const updatedUser = await Users.update(data, {
            where: {
                UID: req.params.id,
            },
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });
    if (req.params.id == req.decodedToken.UID)
        return res.status(403).json({ error: 'Unauthorized: Cannot delete yourself' });
    if (req.params.id == 1) return res.status(403).json({ error: 'Unauthorized: Cannot delete main admin' });

    try {
        await Users.destroy({
            where: {
                UID: req.params.id,
            },
        });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
});

module.exports = router;
