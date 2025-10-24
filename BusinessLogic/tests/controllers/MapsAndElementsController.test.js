const { createMockRes } = require('../utils/mockResponse');

const mockEmit = jest.fn();
const mockIo = {
    to: jest.fn(() => ({ emit: mockEmit })),
};

const commit = jest.fn();
const rollback = jest.fn();
const mockTransaction = { commit, rollback };

const mockMapsAndElements = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    build: jest.fn((row = {}) => ({ ...row, dataValues: row })),
};

const mockMapsToGroupAssignment = {
    create: jest.fn(),
};

const mockDb = {
    QueryTypes: { SELECT: 'SELECT' },
    query: jest.fn(),
    transaction: jest.fn(() => mockTransaction),
    literal: jest.fn(() => 'literal'),
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
        MapsAndElements: mockMapsAndElements,
        MapsToGroupAssignment: mockMapsToGroupAssignment,
    }))
);

const MapsAndElementsController = require('../../controllers/MapsAndElementsController');

function createReq(overrides = {}) {
    return Object.assign(
        {
            cookies: { WarehouseLogisticsToken: 'token' },
            decodedToken: { admin: true, UID: 1 },
            params: {},
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
    mockFindObjectAndParents.mockResolvedValue([{ dataValues: { EID: 2, ETID: 1 } }]);
    mockGetAllowedMaps.mockReturnValue([1]);
    mockDb.query.mockResolvedValue([]);
    mockDb.literal.mockReturnValue('literal');
    mockMapsAndElements.build.mockImplementation((row = {}) => ({ ...row, dataValues: row }));
});

describe('MapsAndElementsController.getMaps', () => {
    it('returns maps', async () => {
        const maps = [{ EID: 1 }];
        mockMapsAndElements.findAll.mockResolvedValue(maps);
        const res = createMockRes();
        await MapsAndElementsController.getMaps(createReq(), res);
        expect(res.json).toHaveBeenCalledWith(maps);
    });

    it('handles errors', async () => {
        mockMapsAndElements.findAll.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await MapsAndElementsController.getMaps(createReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('MapsAndElementsController.getSectors', () => {
    it('returns sectors', async () => {
        const sectors = [{ EID: 2 }];
        mockMapsAndElements.findAll.mockResolvedValue(sectors);
        const res = createMockRes();
        await MapsAndElementsController.getSectors(createReq(), res);
        expect(res.json).toHaveBeenCalledWith(sectors);
    });
});

describe('MapsAndElementsController.getSingleObject', () => {
    it('returns object', async () => {
        const obj = { EID: 3 };
        mockMapsAndElements.findOne.mockResolvedValue(obj);
        const res = createMockRes();
        await MapsAndElementsController.getSingleObject(createReq({ params: { id: 3 } }), res);
        expect(res.json).toHaveBeenCalledWith(obj);
    });

    it('handles errors', async () => {
        mockMapsAndElements.findOne.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await MapsAndElementsController.getSingleObject(createReq({ params: { id: 3 } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('MapsAndElementsController.getMapWithChildren', () => {
    it('returns map hierarchy', async () => {
        mockDb.query.mockResolvedValueOnce([{ EID: 1 }]);
        const res = createMockRes();
        await MapsAndElementsController.getMapWithChildren(createReq({ params: { id: 1 } }), res);
        expect(mockDb.query).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith([{ EID: 1, dataValues: { EID: 1 } }]);
    });

    it('handles errors', async () => {
        mockDb.query.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await MapsAndElementsController.getMapWithChildren(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('MapsAndElementsController.createMapElement', () => {
    it('creates map and emits events', async () => {
        const newElement = { EID: 5 };
        mockMapsAndElements.create.mockResolvedValue(newElement);
        mockMapsToGroupAssignment.create.mockResolvedValue();

        const req = createReq({ body: { ETID: 1 } });
        const res = createMockRes();

        await MapsAndElementsController.createMapElement(req, res);

        expect(mockMapsAndElements.create).toHaveBeenCalled();
        expect(mockMapsToGroupAssignment.create).toHaveBeenCalledWith({ GID: 1, EID: 5 }, expect.any(Object));
        expect(commit).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(mockEmit).toHaveBeenCalled();
    });

    it('rejects non-admin map creation', async () => {
        const res = createMockRes();
        await MapsAndElementsController.createMapElement(
            createReq({ decodedToken: { admin: false }, body: { ETID: 1 } }),
            res
        );
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('requires parent for non-map elements', async () => {
        const res = createMockRes();
        await MapsAndElementsController.createMapElement(createReq({ body: { ETID: 2 } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('MapsAndElementsController.updateMapElement', () => {
    it('denies update when user lacks permission', async () => {
        mockDb.query.mockResolvedValueOnce([{ EID: 1 }]);
        const res = createMockRes();
        await MapsAndElementsController.updateMapElement(createReq({ params: { id: 4 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('updates element and emits notifications', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        mockMapsAndElements.update.mockResolvedValue([1]);
        const updated = { EID: 4 };
        mockMapsAndElements.findByPk.mockResolvedValue(updated);

        const res = createMockRes();
        await MapsAndElementsController.updateMapElement(createReq({ params: { id: 4 }, body: { name: 'n' } }), res);

        expect(mockMapsAndElements.update).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(updated);
        expect(mockEmit).toHaveBeenCalled();
    });
});

describe('MapsAndElementsController.deleteMapElement', () => {
    it('denies deletion when not allowed', async () => {
        mockDb.query.mockResolvedValueOnce([{ EID: 1 }]);
        const res = createMockRes();
        await MapsAndElementsController.deleteMapElement(createReq({ params: { id: 2 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('prevents deleting map without admin', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        mockMapsAndElements.findByPk.mockResolvedValue({ ETID: 1, EID: 3 });
        const res = createMockRes();
        await MapsAndElementsController.deleteMapElement(
            createReq({ decodedToken: { admin: false }, params: { id: 3 } }),
            res
        );
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deletes element and emits events', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        mockMapsAndElements.findByPk.mockResolvedValue({ ETID: 2, EID: 3 });
        mockMapsAndElements.count.mockResolvedValue(1);
        mockMapsAndElements.destroy.mockResolvedValue(1);

        const res = createMockRes();
        await MapsAndElementsController.deleteMapElement(createReq({ params: { id: 3 } }), res);

        expect(mockMapsAndElements.destroy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(204);
        expect(mockEmit).toHaveBeenCalled();
    });

    it('handles unexpected errors', async () => {
        mockDb.query.mockResolvedValueOnce([]);
        mockMapsAndElements.findByPk.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await MapsAndElementsController.deleteMapElement(createReq({ params: { id: 3 } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
