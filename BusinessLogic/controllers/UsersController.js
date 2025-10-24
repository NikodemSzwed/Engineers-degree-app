const bcrypt = require('bcryptjs/dist/bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const { getTokenData } = require('../functions/getTokenData.js');
const getModels = require('../database/getModels.js');

const models = getModels();
const Users = models.Users;
const Groups = models.Groups;
const MapsAndElements = models.MapsAndElements;

function ensureAdmin(req, res) {
    if (!req.decodedToken?.admin) {
        res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });
        return false;
    }
    return true;
}

async function getUsers(req, res) {
    if (!ensureAdmin(req, res)) return;

    try {
        const users = await Users.findAll({
            attributes: {
                exclude: ['passwd'],
            },
        });
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać użytkowników', details: error.message });
    }
}

async function createUser(req, res) {
    if (!ensureAdmin(req, res)) return;
    const newLogin = req.body.login;
    const existingUser = await Users.findOne({
        where: { login: newLogin },
    });
    if (existingUser) return res.status(400).json({ error: `Użytkownik z loginem '${newLogin}' już istnieje` });

    try {
        const HashPasswd = bcrypt.hashSync(req.body.passwd, 10);
        const newUser = await Users.create({
            login: req.body.login,
            email: req.body.email,
            passwd: HashPasswd,
            PersonalSettings_json: req.body.PersonalSettings_json,
        });

        return res.json(newUser);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się utworzyć użytkownika', details: error.message });
    }
}

async function loginUser(req, res) {
    try {
        const user = await Users.findOne({
            where: {
                [Op.or]: [{ email: req.body.login || '' }, { login: req.body.login || '' }],
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
        }

        const isPasswordValid = bcrypt.compareSync(req.body.passwd, user.passwd);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
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
        if (userEIDs.length === 0) {
            throw new Error(`Nie masz uprawnień do żadnych map. Skontaktuj się z administratorem.`);
        }

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
        return res.status(401).json({ error: 'Nie udało się zalogować', details: error.message });
    }
}

async function refreshToken(req, res) {
    try {
        const token = req.cookies['WarehouseLogisticsToken'];

        if (!token) {
            return res.status(401).json({ error: 'Brak dostępu' });
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
        return res.status(500).json({ error: 'Nie udało się zweryfikować tokenu', details: error.message });
    }
}

async function logoutUser(req, res) {
    res.clearCookie('WarehouseLogisticsToken');
    return res.status(200).json({ message: 'Wylogowano' });
}

async function getUserById(req, res) {
    if (!ensureAdmin(req, res)) return;

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
        return res.json(user);
    } catch (error) {
        return res.status(404).json({ error: 'Nie znaleziono użytkownika', details: error.message });
    }
}

async function updateUser(req, res) {
    const isSameUser = req.decodedToken?.UID == req.params.id;
    if (!req.decodedToken?.admin && !isSameUser)
        return res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });

    try {
        let data = removePKandFieldsNotInModel(req.body, Users);

        if (!req.decodedToken?.admin && isSameUser && data.login) {
            return res
                .status(403)
                .json({ error: 'Brak dostępu: do zmiany loginu wymagane są uprawnienia administratora' });
        }

        if (data.passwd) data.passwd = bcrypt.hashSync(data.passwd, 10);
        const updatedUser = await Users.update(data, {
            where: {
                UID: req.params.id,
            },
        });
        return res.json(updatedUser);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się zaktualizować użytkownika', details: error.message });
    }
}

async function deleteUser(req, res) {
    if (!ensureAdmin(req, res)) return;
    if (req.params.id == req.decodedToken.UID)
        return res.status(403).json({ error: 'Brak dostępu: nie możesz usunąć swojego konta' });
    if (req.params.id == 1)
        return res.status(403).json({ error: 'Brak dostępu: nie możesz usunąć konta głównego administratora' });

    try {
        await Users.destroy({
            where: {
                UID: req.params.id,
            },
        });
        return res.status(204).end();
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się usunąć użytkownika', details: error.message });
    }
}

module.exports = {
    getUsers,
    createUser,
    loginUser,
    refreshToken,
    logoutUser,
    getUserById,
    updateUser,
    deleteUser,
};
