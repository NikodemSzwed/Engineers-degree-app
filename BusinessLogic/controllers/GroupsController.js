const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const db = require('../database/db');
const getModels = require('../database/getModels.js');

const models = getModels();
const Groups = models.Groups;
const Membership = models.Membership;
const MapsToGroupAssignment = models.MapsToGroupAssignment;
const Users = models.Users;
const MapsAndElements = models.MapsAndElements;

function ensureAdmin(req, res) {
    if (!req.decodedToken?.admin) {
        res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });
        return false;
    }
    return true;
}

async function getGroups(req, res) {
    if (!ensureAdmin(req, res)) return;

    try {
        const groups = await Groups.findAll();
        return res.json(groups);
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się pobrać grup', details: error.message });
    }
}

async function createGroup(req, res) {
    if (!ensureAdmin(req, res)) return;

    let transaction;
    try {
        transaction = await db.transaction();
        const { userUIDs, mapEIDs } = req.body;
        const newGroup = await Groups.create(removePKandFieldsNotInModel(req.body, Groups), {
            transaction,
        });

        if (!newGroup) {
            throw new Error('Nie udało się utworzyć grupy');
        }

        if (userUIDs && Array.isArray(userUIDs)) {
            const membershipEntries = userUIDs.map(userId => ({
                GID: newGroup.GID,
                UID: userId,
            }));

            await Membership.bulkCreate(membershipEntries, { transaction });
        }

        if (mapEIDs && Array.isArray(mapEIDs)) {
            const mapEntries = mapEIDs.map(mapId => ({
                GID: newGroup.GID,
                EID: mapId,
            }));

            await MapsToGroupAssignment.bulkCreate(mapEntries, { transaction });
        }

        await transaction.commit();
        transaction = null;
        return res.json(newGroup);
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: 'Nie udało się utworzyć grupy', details: error.message });
    }
}

async function getGroupById(req, res) {
    if (!ensureAdmin(req, res)) return;

    try {
        const group = await Groups.findOne({
            where: {
                GID: req.params.id,
            },
            include: [
                {
                    model: Users,
                    required: false,
                    attributes: {
                        exclude: ['passwd', 'PersonalSettings_json'],
                    },
                    through: { attributes: [] },
                },
                {
                    model: MapsAndElements,
                    attributes: ['EID', 'name'],
                    required: false,
                    where: { ETID: 1 },
                    through: { attributes: [] },
                },
            ],
        });
        return res.json(group);
    } catch (error) {
        return res.status(404).json({ error: 'Nie znaleziono grupy', details: error.message });
    }
}

async function updateGroup(req, res) {
    if (!ensureAdmin(req, res)) return;

    let transaction;
    try {
        transaction = await db.transaction();
        const { userUIDs, mapEIDs } = req.body;
        const GID = req.params.id;
        let updatedGroup = [0];

        updatedGroup = await Groups.update(removePKandFieldsNotInModel(req.body, Groups), {
            where: { GID },
            transaction,
        });

        if (userUIDs && Array.isArray(userUIDs)) {
            updatedGroup[0] = 1;
            await Membership.destroy({ where: { GID }, transaction });

            const membershipEntries = userUIDs.map(userId => ({
                GID,
                UID: userId,
            }));
            await Membership.bulkCreate(membershipEntries, { transaction });
        }

        if (mapEIDs && Array.isArray(mapEIDs) && GID != 1) {
            updatedGroup[0] = 1;
            await MapsToGroupAssignment.destroy({ where: { GID }, transaction });

            const mapEntries = mapEIDs.map(mapId => ({
                GID,
                EID: mapId,
            }));
            await MapsToGroupAssignment.bulkCreate(mapEntries, { transaction });
        }

        await transaction.commit();
        transaction = null;
        return res.json(updatedGroup);
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: 'Nie udało się zaktualizować grupy', details: error.message });
    }
}

async function deleteGroup(req, res) {
    if (!ensureAdmin(req, res)) return;
    if (req.params.id == 1)
        return res.status(403).json({ error: 'Brak dostępu: nie można usunąć grupy administracyjnej' });

    try {
        await Groups.destroy({
            where: {
                GID: req.params.id,
            },
        });
        return res.status(204).end();
    } catch (error) {
        return res.status(500).json({ error: 'Nie udało się usunąć grupy', details: error.message });
    }
}

module.exports = {
    getGroups,
    createGroup,
    getGroupById,
    updateGroup,
    deleteGroup,
};
