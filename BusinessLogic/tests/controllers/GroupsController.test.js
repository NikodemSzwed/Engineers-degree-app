const { createMockRes } = require('../utils/mockResponse');

const commit = jest.fn();
const rollback = jest.fn();
const mockTransaction = { commit, rollback };

const mockGroups = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
};

const mockMembership = {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
};

const mockMapsToGroupAssignment = {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
};

jest.mock('../../functions/removePKandFieldsNotInModel.js', () => jest.fn(data => data));

jest.mock('../../database/getModels.js', () =>
    jest.fn(() => ({
        Groups: mockGroups,
        Membership: mockMembership,
        MapsToGroupAssignment: mockMapsToGroupAssignment,
        Users: {},
        MapsAndElements: {},
    }))
);

jest.mock('../../database/db', () => ({
    transaction: jest.fn(() => mockTransaction),
}));

const GroupsController = require('../../controllers/GroupsController');

function createReq(overrides = {}) {
    return Object.assign(
        {
            body: {},
            params: {},
            decodedToken: { admin: true },
        },
        overrides
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    commit.mockClear();
    rollback.mockClear();
});

describe('GroupsController.getGroups', () => {
    it('returns 403 for non-admin', async () => {
        const res = createMockRes();
        await GroupsController.getGroups(createReq({ decodedToken: {} }), res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockGroups.findAll).not.toHaveBeenCalled();
    });

    it('returns groups on success', async () => {
        const groups = [{ GID: 1 }];
        mockGroups.findAll.mockResolvedValue(groups);
        const res = createMockRes();
        await GroupsController.getGroups(createReq(), res);
        expect(res.json).toHaveBeenCalledWith(groups);
    });

    it('handles errors', async () => {
        mockGroups.findAll.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await GroupsController.getGroups(createReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('GroupsController.createGroup', () => {
    it('returns 403 for non-admin', async () => {
        const res = createMockRes();
        await GroupsController.createGroup(createReq({ decodedToken: {} }), res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockGroups.create).not.toHaveBeenCalled();
    });

    it('creates group with relations', async () => {
        const newGroup = { GID: 2 };
        mockGroups.create.mockResolvedValue(newGroup);
        mockMembership.bulkCreate.mockResolvedValue();
        mockMapsToGroupAssignment.bulkCreate.mockResolvedValue();

        const req = createReq({
            body: { name: 'Test', userUIDs: [1, 2], mapEIDs: [10] },
        });
        const res = createMockRes();

        await GroupsController.createGroup(req, res);

        expect(mockGroups.create).toHaveBeenCalled();
        expect(mockMembership.bulkCreate).toHaveBeenCalledWith(
            [
                { GID: 2, UID: 1 },
                { GID: 2, UID: 2 },
            ],
            expect.any(Object)
        );
        expect(mockMapsToGroupAssignment.bulkCreate).toHaveBeenCalledWith([{ GID: 2, EID: 10 }], expect.any(Object));
        expect(res.json).toHaveBeenCalledWith(newGroup);
        expect(commit).toHaveBeenCalled();
    });

    it('rolls back when creation fails', async () => {
        mockGroups.create.mockRejectedValue(new Error('fail'));

        const req = createReq({ body: { name: 'Test' } });
        const res = createMockRes();

        await GroupsController.createGroup(req, res);

        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('GroupsController.getGroupById', () => {
    it('returns 403 for non-admin', async () => {
        const res = createMockRes();
        await GroupsController.getGroupById(createReq({ decodedToken: {} }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns group', async () => {
        const group = { GID: 3 };
        mockGroups.findOne.mockResolvedValue(group);
        const res = createMockRes();
        await GroupsController.getGroupById(createReq({ params: { id: 3 } }), res);
        expect(res.json).toHaveBeenCalledWith(group);
    });

    it('handles not found error', async () => {
        mockGroups.findOne.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await GroupsController.getGroupById(createReq({ params: { id: 3 } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('GroupsController.updateGroup', () => {
    it('returns 403 for non-admin', async () => {
        const res = createMockRes();
        await GroupsController.updateGroup(createReq({ decodedToken: {} }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('updates group and relations', async () => {
        mockGroups.update.mockResolvedValue([1]);
        mockMembership.destroy.mockResolvedValue();
        mockMembership.bulkCreate.mockResolvedValue();
        mockMapsToGroupAssignment.destroy.mockResolvedValue();
        mockMapsToGroupAssignment.bulkCreate.mockResolvedValue();

        const req = createReq({
            params: { id: 2 },
            body: { userUIDs: [5], mapEIDs: [7] },
        });
        const res = createMockRes();

        await GroupsController.updateGroup(req, res);

        expect(mockGroups.update).toHaveBeenCalled();
        expect(mockMembership.destroy).toHaveBeenCalledWith({ where: { GID: 2 }, transaction: mockTransaction });
        expect(mockMapsToGroupAssignment.destroy).toHaveBeenCalledWith({
            where: { GID: 2 },
            transaction: mockTransaction,
        });
        expect(res.json).toHaveBeenCalledWith([1]);
        expect(commit).toHaveBeenCalled();
    });

    it('handles errors during update', async () => {
        mockGroups.update.mockResolvedValue([1]);
        mockMembership.destroy.mockResolvedValue();
        mockMembership.bulkCreate.mockRejectedValue(new Error('fail'));

        const req = createReq({ params: { id: 2 }, body: { userUIDs: [5] } });
        const res = createMockRes();

        await GroupsController.updateGroup(req, res);

        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('updates only membership for admin group', async () => {
        mockMembership.destroy.mockResolvedValue();
        mockMembership.bulkCreate.mockResolvedValue();

        const req = createReq({ params: { id: 1 }, body: { userUIDs: [9] } });
        const res = createMockRes();

        await GroupsController.updateGroup(req, res);

        expect(mockGroups.update).not.toHaveBeenCalled();
        expect(mockMapsToGroupAssignment.destroy).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith([1]);
        expect(commit).toHaveBeenCalled();
    });
});

describe('GroupsController.deleteGroup', () => {
    it('returns 403 for non-admin', async () => {
        const res = createMockRes();
        await GroupsController.deleteGroup(createReq({ decodedToken: {} }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('prevents deleting admin group', async () => {
        const res = createMockRes();
        await GroupsController.deleteGroup(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalled();
    });

    it('deletes group', async () => {
        mockGroups.destroy.mockResolvedValue(1);
        const res = createMockRes();
        await GroupsController.deleteGroup(createReq({ params: { id: 2 } }), res);
        expect(mockGroups.destroy).toHaveBeenCalledWith({ where: { GID: 2 } });
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
    });

    it('returns 500 on failure', async () => {
        mockGroups.destroy.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await GroupsController.deleteGroup(createReq({ params: { id: 2 } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
