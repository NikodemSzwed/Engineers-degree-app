const { createMockRes } = require('../utils/mockResponse');

const mockEmit = jest.fn();
const mockIo = {
    to: jest.fn(() => ({ emit: mockEmit })),
};

const commit = jest.fn();
const rollback = jest.fn();
const mockTransaction = { commit, rollback };

const mockOrders = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
};

const mockMapsAndElements = {
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    build: jest.fn((row = {}) => ({ ...row, dataValues: row })),
};

const mockDb = {
    QueryTypes: { SELECT: 'SELECT' },
    query: jest.fn(),
    transaction: jest.fn(() => mockTransaction),
};

const mockFindObjectAndParents = jest.fn();
const mockGetAllowedMaps = jest.fn();

jest.mock('../../functions/removePKandFieldsNotInModel.js', () => jest.fn(data => data));

jest.mock('../../functions/getTokenData.js', () => ({
    getAllowedMaps: (...args) => mockGetAllowedMaps(...args),
}));

jest.mock('../../server/server', () => ({
    io: mockIo,
    findObjectAndParents: (...args) => mockFindObjectAndParents(...args),
}));

jest.mock('../../database/db', () => mockDb);

jest.mock('../../database/getModels.js', () =>
    jest.fn(() => ({
        Orders: mockOrders,
        MapsAndElements: mockMapsAndElements,
    }))
);

const OrdersController = require('../../controllers/OrdersController');

function createReq(overrides = {}) {
    return Object.assign(
        {
            cookies: { WarehouseLogisticsToken: 'token' },
            decodedToken: { admin: true, UID: 1 },
            params: {},
            query: {},
            body: {},
        },
        overrides
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    mockEmit.mockClear();
    commit.mockClear();
    rollback.mockClear();
    mockIo.to.mockImplementation(() => ({ emit: mockEmit }));
    mockGetAllowedMaps.mockReturnValue([1]);
    mockDb.query.mockResolvedValue([]);
    mockFindObjectAndParents.mockResolvedValue([{ EID: 5, dataValues: { EID: 5, ETID: 2 } }]);
});

describe('OrdersController.createOrder', () => {
    it('creates order and emits events', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        const newElement = { EID: 10 };
        const newOrder = { OID: 1 };
        mockMapsAndElements.create.mockResolvedValue(newElement);
        mockOrders.create.mockResolvedValue(newOrder);

        const res = createMockRes();
        await OrdersController.createOrder(createReq({ body: { ParentEID: 7 } }), res);

        expect(mockMapsAndElements.create).toHaveBeenCalled();
        expect(mockOrders.create).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ newOrder, newElement });
        expect(commit).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalled();
    });

    it('returns 403 when not allowed', async () => {
        mockDb.query.mockResolvedValueOnce([{ EID: 1 }]);
        const res = createMockRes();
        await OrdersController.createOrder(createReq({ body: { ParentEID: 7 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockMapsAndElements.create).not.toHaveBeenCalled();
    });

    it('rolls back on creation error', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        mockMapsAndElements.create.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await OrdersController.createOrder(createReq({ body: { ParentEID: 7 } }), res);
        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('OrdersController.getOrdersByEID', () => {
    it('returns 403 when not allowed', async () => {
        mockDb.query.mockResolvedValueOnce([{ EID: 1 }]);
        const res = createMockRes();
        await OrdersController.getOrdersByEID(createReq({ params: { eid: 2 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns orders on success', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        const orders = [{ OID: 1 }];
        mockOrders.findAll.mockResolvedValue(orders);
        const res = createMockRes();
        await OrdersController.getOrdersByEID(createReq({ params: { eid: 2 } }), res);
        expect(res.json).toHaveBeenCalledWith(orders);
    });

    it('returns 404 on error', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        mockOrders.findAll.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await OrdersController.getOrdersByEID(createReq({ params: { eid: 2 } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('OrdersController.getOrders', () => {
    it('returns 403 when not allowed', async () => {
        mockDb.query.mockResolvedValueOnce([{ EID: 1 }]);
        const res = createMockRes();
        await OrdersController.getOrders(createReq(), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns orders', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        mockDb.query.mockResolvedValueOnce([{ OID: 1 }]);
        const res = createMockRes();
        await OrdersController.getOrders(createReq(), res);
        expect(res.json).toHaveBeenCalledWith([{ OID: 1 }]);
    });

    it('handles errors', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        mockDb.query.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await OrdersController.getOrders(createReq(), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('OrdersController.getOrderById', () => {
    it('returns order when allowed', async () => {
        const order = { EID: 6 };
        mockOrders.findByPk.mockResolvedValue(order);
        mockDb.query.mockResolvedValueOnce([]);
        const res = createMockRes();
        await OrdersController.getOrderById(createReq({ params: { id: 1 } }), res);
        expect(res.json).toHaveBeenCalledWith(order);
    });

    it('returns 403 when access denied', async () => {
        const order = { EID: 6 };
        mockOrders.findByPk.mockResolvedValue(order);
        mockDb.query.mockResolvedValueOnce([{ EID: 1 }]);
        const res = createMockRes();
        await OrdersController.getOrderById(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('handles errors', async () => {
        mockOrders.findByPk.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await OrdersController.getOrderById(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('OrdersController.updateOrder', () => {
    it('returns 404 when order not found', async () => {
        mockOrders.findByPk.mockResolvedValue(null);
        const res = createMockRes();
        await OrdersController.updateOrder(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when access denied', async () => {
        const order = { EID: 6 };
        mockOrders.findByPk.mockResolvedValue(order);
        mockDb.query.mockResolvedValueOnce([{ EID: 1 }]);
        const res = createMockRes();
        await OrdersController.updateOrder(createReq({ params: { id: 1 }, body: {} }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('updates order and emits events', async () => {
        const order = { EID: 6 };
        mockOrders.findByPk.mockResolvedValue(order);
        mockDb.query.mockResolvedValueOnce([]);
        const orderME = { ParentEID: 8 };
        mockMapsAndElements.findByPk.mockResolvedValueOnce(orderME); // for orderME
        mockMapsAndElements.findByPk.mockResolvedValueOnce({ EID: 6 }); // for orderElement after updates
        mockFindObjectAndParents
            .mockResolvedValueOnce([{ EID: 6, dataValues: { EID: 6, ETID: 2 } }])
            .mockResolvedValueOnce([{ EID: 8, dataValues: { EID: 8, ETID: 1 } }]);
        mockOrders.update.mockResolvedValue([1]);
        mockMapsAndElements.update.mockResolvedValue([1]);

        const res = createMockRes();
        await OrdersController.updateOrder(createReq({ params: { id: 1 }, body: { name: 'order' } }), res);

        expect(mockOrders.update).toHaveBeenCalled();
        expect(mockMapsAndElements.update).toHaveBeenCalled();
        expect(commit).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalled();
    });

    it('rolls back on error', async () => {
        const order = { EID: 6 };
        mockOrders.findByPk.mockResolvedValue(order);
        mockDb.query.mockResolvedValueOnce([]);
        mockMapsAndElements.findByPk.mockResolvedValue({ ParentEID: 8 });
        mockOrders.update.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await OrdersController.updateOrder(createReq({ params: { id: 1 }, body: {} }), res);
        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('OrdersController.deleteOrder', () => {
    it('returns 404 when not found', async () => {
        mockOrders.findByPk.mockResolvedValue(null);
        const res = createMockRes();
        await OrdersController.deleteOrder(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when access denied', async () => {
        const order = { EID: 6 };
        mockOrders.findByPk.mockResolvedValue(order);
        mockDb.query.mockResolvedValueOnce([{ EID: 1 }]);
        const res = createMockRes();
        await OrdersController.deleteOrder(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deletes order and emits events', async () => {
        const order = { EID: 6 };
        mockOrders.findByPk.mockResolvedValue(order);
        mockDb.query.mockResolvedValueOnce([]);
        mockMapsAndElements.findByPk.mockResolvedValue({ EID: 6 });
        mockMapsAndElements.destroy.mockResolvedValue(1);
        mockFindObjectAndParents.mockResolvedValue([{ EID: 6, dataValues: { EID: 6, ETID: 2 } }]);

        const res = createMockRes();
        await OrdersController.deleteOrder(createReq({ params: { id: 1 } }), res);

        expect(mockMapsAndElements.destroy).toHaveBeenCalled();
        expect(commit).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(204);
        expect(mockEmit).toHaveBeenCalled();
    });

    it('rolls back on error', async () => {
        const order = { EID: 6 };
        mockOrders.findByPk.mockResolvedValue(order);
        mockDb.query.mockResolvedValueOnce([]);
        mockMapsAndElements.findByPk.mockResolvedValue({ EID: 6 });
        mockMapsAndElements.destroy.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await OrdersController.deleteOrder(createReq({ params: { id: 1 } }), res);
        expect(rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
