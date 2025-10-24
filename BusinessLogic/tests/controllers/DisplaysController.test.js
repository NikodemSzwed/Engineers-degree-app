const { createMockRes } = require('../utils/mockResponse');

const mockDisplays = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
};

const mockDisplayElementsAssignment = {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
};

const mockMapsAndElements = {
    build: jest.fn(),
    findByPk: jest.fn(),
};

const mockOrders = {};
const mockDeliveries = {};
const mockAlerts = {
    findAll: jest.fn(),
    create: jest.fn(),
};

const mockAlertsTypes = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
};

const mockElementsTypes = {};

const mockFindObjectAndParents = jest.fn();
const mockEmit = jest.fn();
const mockIo = {
    to: jest.fn(() => ({ emit: mockEmit })),
};

const commit = jest.fn();
const rollback = jest.fn();
const mockTransaction = { commit, rollback };

const mockDb = {
    transaction: jest.fn(() => mockTransaction),
    query: jest.fn(),
    QueryTypes: { SELECT: 'SELECT' },
};

jest.mock('../../functions/removePKandFieldsNotInModel.js', () => jest.fn(input => input));

jest.mock('../../database/getModels.js', () =>
    jest.fn(() => ({
        Displays: mockDisplays,
        DisplayElementsAssignment: mockDisplayElementsAssignment,
        MapsAndElements: mockMapsAndElements,
        Orders: mockOrders,
        Deliveries: mockDeliveries,
        Alerts: mockAlerts,
        AlertsTypes: mockAlertsTypes,
        ElementsTypes: mockElementsTypes,
    }))
);

jest.mock('../../database/db', () => mockDb);

jest.mock('../../server/server', () => ({
    io: mockIo,
    findObjectAndParents: (...args) => mockFindObjectAndParents(...args),
}));

const mockJwtSign = jest.fn(() => 'signed-token');
jest.mock('jsonwebtoken', () => ({
    sign: (...args) => mockJwtSign(...args),
}));

const DisplaysController = require('../../controllers/DisplaysController');

function createReq(overrides = {}) {
    return Object.assign(
        {
            cookies: {},
            body: {},
            params: {},
            decodedToken: {},
        },
        overrides
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    mockDb.query.mockResolvedValue([]);
    mockMapsAndElements.build.mockImplementation(row => ({ ...row, dataValues: { ...row } }));
    mockAlerts.findAll.mockResolvedValue([]);
    mockAlertsTypes.findAll.mockResolvedValue([]);
    mockFindObjectAndParents.mockResolvedValue([{ dataValues: { EID: 1 } }]);
});

describe('DisplaysController.getDisplays', () => {
    it('requires admin and returns displays', async () => {
        const displays = [{ DID: 1 }];
        mockDisplays.findAll.mockResolvedValue(displays);
        const req = createReq({ decodedToken: { admin: true } });
        const res = createMockRes();

        await DisplaysController.getDisplays(req, res);

        expect(res.json).toHaveBeenCalledWith(displays);
    });

    it('returns 403 when no admin', async () => {
        const res = createMockRes();
        await DisplaysController.getDisplays(createReq(), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('handles data errors', async () => {
        mockDisplays.findAll.mockRejectedValue(new Error('fail'));
        const req = createReq({ decodedToken: { admin: true } });
        const res = createMockRes();

        await DisplaysController.getDisplays(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('DisplaysController.createDisplay', () => {
    it('creates display and assignments', async () => {
        mockDisplays.create.mockResolvedValue({ DID: 1 });

        const req = createReq({ decodedToken: { admin: true }, body: { EIDs: [1, 2], name: 'Display' } });
        const res = createMockRes();

        await DisplaysController.createDisplay(req, res);

        expect(mockDisplays.create).toHaveBeenCalled();
        expect(mockDisplayElementsAssignment.bulkCreate).toHaveBeenCalled();
        expect(commit).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ DID: 1 });
    });

    it('rolls back on failure', async () => {
        mockDisplays.create.mockRejectedValue(new Error('fail'));

        const req = createReq({ decodedToken: { admin: true }, body: {} });
        const res = createMockRes();

        await DisplaysController.createDisplay(req, res);

        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('DisplaysController.registerDisplay', () => {
    it('registers a display', async () => {
        mockDisplays.create.mockResolvedValue({ UUID: 'abc' });

        const res = createMockRes();
        await DisplaysController.registerDisplay(createReq(), res);

        expect(res.json).toHaveBeenCalledWith({ UUID: 'abc' });
    });

    it('handles errors', async () => {
        mockDisplays.create.mockRejectedValue(new Error('fail'));

        const res = createMockRes();
        await DisplaysController.registerDisplay(createReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('DisplaysController.loginDisplay', () => {
    it('returns token on successful login', async () => {
        mockDisplays.findOne
            .mockResolvedValueOnce({ UUID: 'uuid' })
            .mockResolvedValueOnce({ UUID: 'uuid', DisplayElementsAssignments: [{ EID: 1 }], MapsAndElements: [] });

        const req = createReq({ body: { UUID: 'uuid' } });
        const res = createMockRes();

        await DisplaysController.loginDisplay(req, res);

        expect(mockJwtSign).toHaveBeenCalled();
        expect(res.cookie).toHaveBeenCalledWith('WarehouseLogisticsToken', 'signed-token', expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 401 when display missing', async () => {
        mockDisplays.findOne.mockResolvedValue(null);

        const req = createReq({ body: { UUID: 'uuid' } });
        const res = createMockRes();

        await DisplaysController.loginDisplay(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('handles unexpected errors', async () => {
        mockDisplays.findOne.mockRejectedValue(new Error('fail'));

        const req = createReq({ body: { UUID: 'uuid' } });
        const res = createMockRes();

        await DisplaysController.loginDisplay(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });
});

describe('DisplaysController.getDisplayById', () => {
    it('returns display data for admin', async () => {
        mockDb.query.mockResolvedValue([{ EID: 1 }]);
        mockDisplays.findOne.mockResolvedValue({
            MapsAndElements: [{ Orders: [] }],
            dataValues: { DID: 1 },
        });

        const req = createReq({ decodedToken: { admin: true }, params: { id: 1 } });
        const res = createMockRes();

        await DisplaysController.getDisplayById(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ DID: 1, MapsAndElements: expect.any(Array) }));
    });

    it('returns 403 for non-admin', async () => {
        const res = createMockRes();
        await DisplaysController.getDisplayById(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('handles errors', async () => {
        mockDb.query.mockRejectedValue(new Error('fail'));
        mockDisplays.findOne.mockResolvedValue({ MapsAndElements: [], dataValues: { DID: 1 } });

        const req = createReq({ decodedToken: { admin: true }, params: { id: 1 } });
        const res = createMockRes();

        await DisplaysController.getDisplayById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('DisplaysController.remoteCreateAlert', () => {
    it('creates alert for validated display', async () => {
        mockDisplays.findOne.mockResolvedValueOnce(null);
        mockDb.query.mockResolvedValue([{ EID: 2 }]);
        mockAlerts.create.mockResolvedValue({ dataValues: { EID: 2, AAID: 3 } });
        mockMapsAndElements.findByPk.mockResolvedValue({ dataValues: { name: 'Element' } });
        mockAlertsTypes.findByPk.mockResolvedValue({ dataValues: { name: 'Type' } });

        const req = createReq({ params: { uuid: 'uuid' }, body: { EID: 2, AAID: 3 } });
        const res = createMockRes();

        await DisplaysController.remoteCreateAlert(req, res);

        expect(mockAlerts.create).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ EIDName: 'Element' }));
        expect(mockEmit).toHaveBeenCalled();
    });

    it('returns 404 when element not accessible', async () => {
        mockDisplays.findOne.mockResolvedValueOnce(null);
        mockDb.query.mockResolvedValue([]);

        const req = createReq({ params: { uuid: 'uuid' }, body: { EID: 2, AAID: 3 } });
        const res = createMockRes();

        await DisplaysController.remoteCreateAlert(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('DisplaysController.remoteGetDisplay', () => {
    it('returns display data for remote client', async () => {
        mockDisplays.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
            MapsAndElements: [{ Orders: [] }],
            dataValues: { DID: 1 },
        });
        mockDb.query.mockResolvedValue([{ EID: 1 }]);
        mockAlertsTypes.findAll.mockResolvedValue([]);

        const req = createReq({ params: { uuid: 'uuid' } });
        const res = createMockRes();

        await DisplaysController.remoteGetDisplay(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ MapsAndElements: expect.any(Array) }));
    });

    it('returns 403 when display not validated', async () => {
        mockDisplays.findOne.mockResolvedValue({});

        const req = createReq({ params: { uuid: 'uuid' } });
        const res = createMockRes();

        await DisplaysController.remoteGetDisplay(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });
});

describe('DisplaysController.updateDisplay', () => {
    it('updates display configuration', async () => {
        mockDisplays.update.mockResolvedValue([1]);
        mockDisplayElementsAssignment.destroy.mockResolvedValue(1);
        mockDisplayElementsAssignment.bulkCreate.mockResolvedValue([]);
        mockDisplays.findOne.mockResolvedValue({ dataValues: { UUID: 'uuid' } });

        const req = createReq({ decodedToken: { admin: true }, params: { id: 1 }, body: { EIDs: [1], name: 'Name' } });
        const res = createMockRes();

        await DisplaysController.updateDisplay(req, res);

        expect(mockDisplays.update).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalledWith('updateDisplay', expect.any(Object));
        expect(res.json).toHaveBeenCalledWith([1]);
    });

    it('rolls back on update error', async () => {
        mockDisplays.update.mockRejectedValue(new Error('fail'));

        const req = createReq({ decodedToken: { admin: true }, params: { id: 1 }, body: {} });
        const res = createMockRes();

        await DisplaysController.updateDisplay(req, res);

        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('DisplaysController.deleteDisplay', () => {
    it('deletes display', async () => {
        mockDisplays.findOne.mockResolvedValue({ dataValues: { UUID: 'uuid' } });
        mockDisplays.destroy.mockResolvedValue(1);

        const req = createReq({ decodedToken: { admin: true }, params: { id: 1 } });
        const res = createMockRes();

        await DisplaysController.deleteDisplay(req, res);

        expect(mockDisplays.destroy).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalledWith('deleteDisplay');
        expect(res.status).toHaveBeenCalledWith(204);
    });

    it('returns 404 when display missing', async () => {
        mockDisplays.findOne.mockResolvedValue(null);

        const req = createReq({ decodedToken: { admin: true }, params: { id: 1 } });
        const res = createMockRes();

        await DisplaysController.deleteDisplay(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('handles delete errors', async () => {
        mockDisplays.findOne.mockResolvedValue({ dataValues: { UUID: 'uuid' } });
        mockDisplays.destroy.mockRejectedValue(new Error('fail'));

        const req = createReq({ decodedToken: { admin: true }, params: { id: 1 } });
        const res = createMockRes();

        await DisplaysController.deleteDisplay(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
