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

    try {
        const HashPasswd = bcrypt.hashSync(req.body.passwd, 10);
        const newUser = await Users.create({
            login: req.body.login,
            email: req.body.email,
            passwd: HashPasswd,
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
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            maxAge: 3600000,
        });

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.UID,
                email: user.email,
                login: user.login,
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

        const newtoken = jwt.sign(
            {
                UID: decodedToken.UID,
                userEIDs,
                admin: userGroups.length > 0,
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        // const newtoken = jwt.sign(
        //     decodedToken,
        //     process.env.JWT_SECRET || 'secret'
        // );

        res.clearCookie('WarehouseLogisticsToken');
        res.cookie('WarehouseLogisticsToken', newtoken, {
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production' ? true : false,
            maxAge: 3600000,
        });

        return res.status(200).json({
            message: 'Token refreshed',
            adminPrivileges: decodedToken.admin,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify token', details: error.message });
    }
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
                    required: true,
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
    if (!req.decodedToken.admin) return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });

    try {
        let data = removePKandFieldsNotInModel(req.body, Users);
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
