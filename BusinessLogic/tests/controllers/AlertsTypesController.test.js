const { createMockRes } = require('../utils/mockResponse');

const mockAlertsTypes = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
};

const mockATAssignment = {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
};

const mockElementsTypes = {};

const commit = jest.fn();
const rollback = jest.fn();
const mockTransaction = { commit, rollback };
const mockDb = {
    transaction: jest.fn(() => mockTransaction),
};

jest.mock('../../functions/removePKandFieldsNotInModel.js', () => jest.fn(input => input));

jest.mock('../../database/getModels.js', () =>
    jest.fn(() => ({
        AlertsTypes: mockAlertsTypes,
        ATtoETAssignment: mockATAssignment,
        ElementsTypes: mockElementsTypes,
    }))
);

jest.mock('../../database/db', () => mockDb);

const AlertsTypesController = require('../../controllers/AlertsTypesController');

function createAdminReq(overrides = {}) {
    return Object.assign(
        {
            decodedToken: { admin: true },
            body: {},
            params: {},
        },
        overrides
    );
}

function createMockReq(overrides = {}) {
    return Object.assign(
        {
            decodedToken: {},
            body: {},
            params: {},
        },
        overrides
    );
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('AlertsTypesController.getAlertTypes', () => {
    it('returns alert types', async () => {
        const alertTypes = [{ AAID: 1 }];
        mockAlertsTypes.findAll.mockResolvedValue(alertTypes);

        const res = createMockRes();
        await AlertsTypesController.getAlertTypes(createMockReq(), res);

        expect(res.json).toHaveBeenCalledWith(alertTypes);
    });

    it('handles errors', async () => {
        mockAlertsTypes.findAll.mockRejectedValue(new Error('fail'));

        const res = createMockRes();
        await AlertsTypesController.getAlertTypes(createMockReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('AlertsTypesController.createAlertType', () => {
    it('requires admin rights', async () => {
        const res = createMockRes();
        await AlertsTypesController.createAlertType(createMockReq(), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('creates alert type and assignments', async () => {
        mockAlertsTypes.create.mockResolvedValue({ AAID: 1 });

        const res = createMockRes();
        await AlertsTypesController.createAlertType(createAdminReq({ body: { ETIDs: [1, 2] } }), res);

        expect(mockAlertsTypes.create).toHaveBeenCalled();
        expect(mockATAssignment.bulkCreate).toHaveBeenCalled();
        expect(commit).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ AAID: 1 });
    });

    it('rolls back on failure', async () => {
        mockAlertsTypes.create.mockRejectedValue(new Error('db'));

        const res = createMockRes();
        await AlertsTypesController.createAlertType(createAdminReq(), res);

        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('AlertsTypesController.getAlertTypeById', () => {
    it('returns alert type details', async () => {
        const alertType = { AAID: 1 };
        mockAlertsTypes.findOne.mockResolvedValue(alertType);

        const res = createMockRes();
        await AlertsTypesController.getAlertTypeById(createAdminReq({ params: { id: 1 } }), res);

        expect(res.json).toHaveBeenCalledWith(alertType);
    });

    it('handles errors', async () => {
        mockAlertsTypes.findOne.mockRejectedValue(new Error('fail'));

        const res = createMockRes();
        await AlertsTypesController.getAlertTypeById(createAdminReq({ params: { id: 1 } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('AlertsTypesController.updateAlertType', () => {
    it('updates alert type and reassigns elements', async () => {
        mockAlertsTypes.update.mockResolvedValue([1]);

        const res = createMockRes();
        await AlertsTypesController.updateAlertType(createAdminReq({ params: { id: 1 }, body: { ETIDs: [1] } }), res);

        expect(mockAlertsTypes.update).toHaveBeenCalled();
        expect(mockATAssignment.destroy).toHaveBeenCalled();
        expect(mockATAssignment.bulkCreate).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith([1]);
    });

    it('rolls back on update failure', async () => {
        mockAlertsTypes.update.mockRejectedValue(new Error('fail'));

        const res = createMockRes();
        await AlertsTypesController.updateAlertType(createAdminReq({ params: { id: 1 } }), res);

        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('AlertsTypesController.deleteAlertType', () => {
    it('requires admin rights', async () => {
        const res = createMockRes();
        await AlertsTypesController.deleteAlertType(createMockReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 404 when not found', async () => {
        mockAlertsTypes.destroy.mockResolvedValue(0);

        const res = createMockRes();
        await AlertsTypesController.deleteAlertType(createAdminReq({ params: { id: 1 } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes alert type', async () => {
        mockAlertsTypes.destroy.mockResolvedValue(1);

        const res = createMockRes();
        await AlertsTypesController.deleteAlertType(createAdminReq({ params: { id: 1 } }), res);

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
    });

    it('handles delete errors', async () => {
        mockAlertsTypes.destroy.mockRejectedValue(new Error('fail'));

        const res = createMockRes();
        await AlertsTypesController.deleteAlertType(createAdminReq({ params: { id: 1 } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
