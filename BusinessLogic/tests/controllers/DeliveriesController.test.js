const { createMockRes } = require('../utils/mockResponse');

const mockDeliveries = {
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
};

const mockOrders = {
    findByPk: jest.fn(),
    findOne: jest.fn(),
};

const mockMapsAndElements = {
    build: jest.fn(),
};

const commit = jest.fn();
const rollback = jest.fn();
const mockTransaction = { commit, rollback };

const mockDb = {
    transaction: jest.fn(() => mockTransaction),
    query: jest.fn(),
    QueryTypes: { SELECT: 'SELECT' },
};

const mockGetAllowedMaps = jest.fn();

jest.mock('../../functions/removePKandFieldsNotInModel.js', () => jest.fn(input => input));

jest.mock('../../database/getModels.js', () =>
    jest.fn(() => ({
        Deliveries: mockDeliveries,
        Orders: mockOrders,
        MapsAndElements: mockMapsAndElements,
    }))
);

jest.mock('../../database/db', () => mockDb);

jest.mock('../../functions/getTokenData.js', () => ({
    getAllowedMaps: (...args) => mockGetAllowedMaps(...args),
}));

const DeliveriesController = require('../../controllers/DeliveriesController');

function createReq(overrides = {}) {
    return Object.assign(
        {
            cookies: { WarehouseLogisticsToken: 'token' },
            body: {},
            params: {},
            decodedToken: {},
        },
        overrides
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllowedMaps.mockReturnValue([1]);
    mockDb.query.mockResolvedValue([]);
    mockMapsAndElements.build.mockImplementation(row => row);
});

describe('DeliveriesController.createDelivery', () => {
    it('creates a delivery when permitted', async () => {
        const order = { EID: 5 };
        mockOrders.findByPk.mockResolvedValue(order);
        mockDeliveries.create.mockResolvedValue({ DelivID: 1 });

        const req = createReq({ body: { OID: 1 } });
        const res = createMockRes();

        await DeliveriesController.createDelivery(req, res);

        expect(mockDeliveries.create).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ DelivID: 1 });
        expect(commit).toHaveBeenCalled();
    });

    it('rolls back when creation fails', async () => {
        mockOrders.findByPk.mockResolvedValue({ EID: 5 });
        mockDeliveries.create.mockRejectedValue(new Error('fail'));

        const req = createReq({ body: { OID: 1 } });
        const res = createMockRes();

        await DeliveriesController.createDelivery(req, res);

        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('DeliveriesController.getDeliveryById', () => {
    it('returns delivery if accessible', async () => {
        mockOrders.findOne.mockResolvedValue({ EID: 7, Deliveries: [{ DelivID: 2 }] });

        const req = createReq({ params: { id: 2 } });
        const res = createMockRes();

        await DeliveriesController.getDeliveryById(req, res);

        expect(res.json).toHaveBeenCalledWith({ DelivID: 2 });
    });

    it('returns 500 on error', async () => {
        mockOrders.findOne.mockRejectedValue(new Error('fail'));

        const req = createReq({ params: { id: 2 } });
        const res = createMockRes();

        await DeliveriesController.getDeliveryById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('DeliveriesController.updateDelivery', () => {
    it('updates delivery when user has access', async () => {
        mockOrders.findOne.mockResolvedValue({ EID: 8 });
        mockDeliveries.update.mockResolvedValue([1]);

        const req = createReq({ params: { id: 2 }, body: {} });
        const res = createMockRes();

        await DeliveriesController.updateDelivery(req, res);

        expect(mockDeliveries.update).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith([1]);
        expect(commit).toHaveBeenCalled();
    });

    it('handles update errors', async () => {
        mockOrders.findOne.mockResolvedValue({ EID: 8 });
        mockDeliveries.update.mockRejectedValue(new Error('fail'));

        const req = createReq({ params: { id: 2 }, body: {} });
        const res = createMockRes();

        await DeliveriesController.updateDelivery(req, res);

        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('DeliveriesController.deleteDelivery', () => {
    it('deletes delivery', async () => {
        mockOrders.findOne.mockResolvedValue({ EID: 10 });
        mockDeliveries.destroy.mockResolvedValue(1);

        const req = createReq({ params: { id: 3 } });
        const res = createMockRes();

        await DeliveriesController.deleteDelivery(req, res);

        expect(mockDeliveries.destroy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
        expect(commit).toHaveBeenCalled();
    });

    it('rolls back on delete error', async () => {
        mockOrders.findOne.mockResolvedValue({ EID: 10 });
        mockDeliveries.destroy.mockRejectedValue(new Error('fail'));

        const req = createReq({ params: { id: 3 } });
        const res = createMockRes();

        await DeliveriesController.deleteDelivery(req, res);

        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
