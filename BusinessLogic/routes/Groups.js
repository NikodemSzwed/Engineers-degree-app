const express = require('express');
const router = express.Router();
const removePKandFieldsNotInModel = require('../functions/removePKandFieldsNotInModel.js');
const db = require('../database/db');
const models = require('../database/getModels.js')();
const Groups = models.Groups;
const Membership = models.Membership;
const MapsToGroupAssignment = models.MapsToGroupAssignment;
const Users = models.Users;
const MapsAndElements = models.MapsAndElements;

router.get('/', async (req, res) => {
    if (!req.decodedToken.admin)
        return res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });

    try {
        const groups = await Groups.findAll();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Nie udało się pobrać grup', details: error.message });
    }
});

router.post('/', async (req, res) => {
    if (!req.decodedToken.admin)
        return res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });

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
        res.json(newGroup);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Nie udało się utworzyć grupy', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
    if (!req.decodedToken.admin)
        return res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });

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
        res.json(group);
    } catch (error) {
        res.status(404).json({ error: 'Nie znaleziono grupy', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    if (!req.decodedToken.admin)
        return res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });

    let transaction;
    try {
        transaction = await db.transaction();
        const { userUIDs, mapEIDs } = req.body;
        const GID = req.params.id;
        let updatedGroup = [0];
        if (GID != 1) {
            updatedGroup = await Groups.update(removePKandFieldsNotInModel(req.body, Groups), {
                where: { GID },
                transaction,
            });
        }

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
        res.json(updatedGroup);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: 'Nie udało się zaktualizować grupy', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    if (!req.decodedToken.admin)
        return res.status(403).json({ error: 'Brak dostępu: wymagane są uprawnienia administratora' });
    if (req.params.id == 1)
        return res.status(403).json({ error: 'Brak dostępu: nie można usunąć grupy administracyjnej' });

    try {
        await Groups.destroy({
            where: {
                GID: req.params.id,
            },
        });
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Nie udało się usunąć grupy', details: error.message });
    }
});

module.exports = router;
