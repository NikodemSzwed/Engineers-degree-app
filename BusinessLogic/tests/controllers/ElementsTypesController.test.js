const { createMockRes } = require('../utils/mockResponse');

const mockElementsTypes = {
    findAll: jest.fn(),
};

jest.mock('../../database/getModels.js', () =>
    jest.fn(() => ({
        ElementsTypes: mockElementsTypes,
    }))
);

const ElementsTypesController = require('../../controllers/ElementsTypesController');

function createReq(overrides = {}) {
    return Object.assign({ params: {}, body: {} }, overrides);
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ElementsTypesController.createElementType', () => {
    it('always responds with 405', async () => {
        const res = createMockRes();
        await ElementsTypesController.createElementType(createReq(), res);
        expect(res.status).toHaveBeenCalledWith(405);
    });
});

describe('ElementsTypesController.getElementTypes', () => {
    it('returns list of element types', async () => {
        const types = [{ ETID: 1 }];
        mockElementsTypes.findAll.mockResolvedValue(types);
        const res = createMockRes();
        await ElementsTypesController.getElementTypes(createReq(), res);
        expect(res.json).toHaveBeenCalledWith(types);
    });

    it('returns 404 on error', async () => {
        mockElementsTypes.findAll.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await ElementsTypesController.getElementTypes(createReq(), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('ElementsTypesController.getElementTypeById', () => {
    it('returns element type', async () => {
        const types = [{ ETID: 1 }];
        mockElementsTypes.findAll.mockResolvedValue(types);
        const res = createMockRes();
        await ElementsTypesController.getElementTypeById(createReq({ params: { id: 1 } }), res);
        expect(res.json).toHaveBeenCalledWith(types);
    });

    it('returns 404 on error', async () => {
        mockElementsTypes.findAll.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await ElementsTypesController.getElementTypeById(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('ElementsTypesController.updateElementType', () => {
    it('always responds with 405', async () => {
        const res = createMockRes();
        await ElementsTypesController.updateElementType(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(405);
    });
});

describe('ElementsTypesController.deleteElementType', () => {
    it('always responds with 405', async () => {
        const res = createMockRes();
        await ElementsTypesController.deleteElementType(createReq({ params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(405);
    });
});
