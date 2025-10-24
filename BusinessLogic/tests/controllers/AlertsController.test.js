const { createMockRes } = require('../utils/mockResponse');

const mockAlerts = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    build: jest.fn(),
};

const mockAlertsTypes = {
    findByPk: jest.fn(),
};

const mockMapsAndElements = {
    build: jest.fn(),
    findByPk: jest.fn(),
};

const mockQuery = jest.fn();
const mockFindObjectAndParents = jest.fn();
const mockEmit = jest.fn();
const mockIo = {
    to: jest.fn(() => ({
        emit: mockEmit,
    })),
};
const mockGetAllowedMaps = jest.fn();

jest.mock('../../functions/removePKandFieldsNotInModel.js', () => jest.fn(input => input));

jest.mock('../../database/getModels.js', () =>
    jest.fn(() => ({
        Alerts: mockAlerts,
        AlertsTypes: mockAlertsTypes,
        MapsAndElements: mockMapsAndElements,
    }))
);

jest.mock('../../database/db', () => ({
    query: (...args) => mockQuery(...args),
    QueryTypes: { SELECT: 'SELECT' },
}));

jest.mock('../../functions/getTokenData.js', () => ({
    getAllowedMaps: (...args) => mockGetAllowedMaps(...args),
}));

jest.mock('../../server/server', () => ({
    io: mockIo,
    findObjectAndParents: (...args) => mockFindObjectAndParents(...args),
}));

const AlertsController = require('../../controllers/AlertsController');

function createMockReq(overrides = {}) {
    return Object.assign(
        {
            cookies: { WarehouseLogisticsToken: 'token' },
            body: {},
            query: {},
            params: {},
            decodedToken: {},
        },
        overrides
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllowedMaps.mockReturnValue([1]);
    mockMapsAndElements.build.mockImplementation(row => row);
    mockAlerts.build.mockImplementation(row => row);
    mockQuery.mockResolvedValue([]);
    mockFindObjectAndParents.mockResolvedValue([{ dataValues: { EID: 1 } }]);
});

describe('AlertsController.createAlert', () => {
    it('returns 201 on successful creation', async () => {
        const newAlert = { dataValues: { EID: 2, AAID: 3 } };
        const alertElement = { dataValues: { name: 'Element' } };
        const alertType = { dataValues: { name: 'Type' } };
        mockAlerts.create.mockResolvedValue(newAlert);
        mockMapsAndElements.findByPk.mockResolvedValue(alertElement);
        mockAlertsTypes.findByPk.mockResolvedValue(alertType);

        const req = createMockReq({ body: { EID: 2, AAID: 3 } });
        const res = createMockRes();

        await AlertsController.createAlert(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(newAlert);
        expect(mockEmit).toHaveBeenCalledWith('newAlert', expect.objectContaining({ roomEID: expect.any(Number) }));
    });

    it('returns 500 when creation fails', async () => {
        mockAlerts.create.mockRejectedValue(new Error('db error'));

        const req = createMockReq({ body: { EID: 2, AAID: 3 } });
        const res = createMockRes();

        await AlertsController.createAlert(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
});

describe('AlertsController.getAlerts', () => {
    it('returns alerts list', async () => {
        const alerts = [{ id: 1 }];
        mockQuery.mockResolvedValue([{ EID: 10 }]);
        mockAlerts.findAll.mockResolvedValue(alerts);

        const req = createMockReq({ query: {} });
        const res = createMockRes();

        await AlertsController.getAlerts(req, res);

        expect(res.json).toHaveBeenCalledWith(alerts);
    });

    it('handles errors', async () => {
        mockAlerts.findAll.mockRejectedValue(new Error('failed'));

        const req = createMockReq();
        const res = createMockRes();

        await AlertsController.getAlerts(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
});

describe('AlertsController.getAlertById', () => {
    it('returns a single alert', async () => {
        const alert = [{ AID: 1 }];
        mockQuery.mockResolvedValue([{ AID: 1 }]);
        mockAlerts.findAll.mockResolvedValue(alert);

        const req = createMockReq({ params: { id: 1 } });
        const res = createMockRes();

        await AlertsController.getAlertById(req, res);

        expect(res.json).toHaveBeenCalledWith(alert[0]);
    });

    it('handles errors when fetching', async () => {
        mockAlerts.findAll.mockRejectedValue(new Error('boom'));
        mockQuery.mockResolvedValue([{ AID: 1 }]);

        const req = createMockReq({ params: { id: 1 } });
        const res = createMockRes();

        await AlertsController.getAlertById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
});

describe('AlertsController.getAlertsByEID', () => {
    it('returns alerts for display without permission check', async () => {
        const alerts = [{ id: 1 }];
        mockAlerts.findAll.mockResolvedValue(alerts);

        const req = createMockReq({
            params: { eid: 5 },
            decodedToken: { displayUUID: 'uuid' },
            body: {},
        });
        const res = createMockRes();

        await AlertsController.getAlertsByEID(req, res);

        expect(res.json).toHaveBeenCalledWith(alerts);
    });

    it('handles errors when fetching alerts by eid', async () => {
        mockAlerts.findAll.mockRejectedValue(new Error('fetch error'));

        const req = createMockReq({
            params: { eid: 5 },
            decodedToken: { displayUUID: 'uuid' },
        });
        const res = createMockRes();

        await AlertsController.getAlertsByEID(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
});

describe('AlertsController.updateAlert', () => {
    it('updates alert successfully', async () => {
        const alertInstance = { EID: 7 };
        const alertData = { dataValues: { EID: 7, AAID: 3 } };
        const alertElement = { dataValues: { name: 'Element' } };
        const alertType = { dataValues: { name: 'Type' } };
        mockAlerts.findByPk.mockResolvedValueOnce(alertInstance).mockResolvedValueOnce(alertData);
        mockAlerts.update.mockResolvedValue([1]);
        mockMapsAndElements.findByPk.mockResolvedValue(alertElement);
        mockAlertsTypes.findByPk.mockResolvedValue(alertType);

        const req = createMockReq({ params: { id: 1 }, body: {} });
        const res = createMockRes();

        await AlertsController.updateAlert(req, res);

        expect(res.json).toHaveBeenCalledWith([1]);
        expect(mockEmit).toHaveBeenCalledWith('updateAlert', expect.any(Object));
    });

    it('returns 500 on update failure', async () => {
        const alertInstance = { EID: 7 };
        mockAlerts.findByPk.mockResolvedValue(alertInstance);
        mockAlerts.update.mockRejectedValue(new Error('update error'));

        const req = createMockReq({ params: { id: 1 }, body: {} });
        const res = createMockRes();

        await AlertsController.updateAlert(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
});

describe('AlertsController.deleteAlert', () => {
    it('deletes alert successfully', async () => {
        const alert = { dataValues: { EID: 7 } };
        mockAlerts.findByPk.mockResolvedValue(alert);
        mockAlerts.destroy.mockResolvedValue(1);

        const req = createMockReq({ params: { id: 1 } });
        const res = createMockRes();

        await AlertsController.deleteAlert(req, res);

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalledWith('deleteAlert', expect.any(Object));
    });

    it('handles errors during delete', async () => {
        mockAlerts.findByPk.mockResolvedValue({ dataValues: { EID: 7 } });
        mockAlerts.destroy.mockRejectedValue(new Error('delete error'));

        const req = createMockReq({ params: { id: 1 } });
        const res = createMockRes();

        await AlertsController.deleteAlert(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
});
