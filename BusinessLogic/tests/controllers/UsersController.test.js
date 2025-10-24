const { createMockRes } = require('../utils/mockResponse');

const mockUsers = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
};

const mockGroups = {
    findAll: jest.fn(),
};

const mockMapsAndElements = {
    findAll: jest.fn(),
};

jest.mock('bcryptjs/dist/bcrypt', () => ({
    hashSync: jest.fn(() => 'hashed'),
    compareSync: jest.fn(() => true),
}));

const bcrypt = require('bcryptjs/dist/bcrypt');

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'signed-token'),
}));

const jwt = require('jsonwebtoken');

jest.mock('../../functions/removePKandFieldsNotInModel.js', () => jest.fn(data => data));
const removePKandFieldsNotInModel = require('../../functions/removePKandFieldsNotInModel.js');

const mockGetTokenData = jest.fn();
jest.mock('../../functions/getTokenData.js', () => ({
    getTokenData: (...args) => mockGetTokenData(...args),
}));

jest.mock('../../database/getModels.js', () =>
    jest.fn(() => ({
        Users: mockUsers,
        Groups: mockGroups,
        MapsAndElements: mockMapsAndElements,
    }))
);

const UsersController = require('../../controllers/UsersController');

function createReq(overrides = {}) {
    return Object.assign(
        {
            decodedToken: { admin: true, UID: 1 },
            params: {},
            body: {},
            cookies: {},
        },
        overrides
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    mockUsers.findOne.mockReset();
    mockUsers.findAll.mockReset();
    mockUsers.create.mockReset();
    mockUsers.update.mockReset();
    mockUsers.destroy.mockReset();
    mockGroups.findAll.mockReset();
    mockMapsAndElements.findAll.mockReset();
    removePKandFieldsNotInModel.mockImplementation(data => data);
    mockUsers.findOne.mockResolvedValue(null);
    mockMapsAndElements.findAll.mockResolvedValue([{ EID: 1 }]);
    mockGroups.findAll.mockResolvedValue([]);
    bcrypt.compareSync.mockReturnValue(true);
    mockGetTokenData.mockReturnValue({ UID: 1, admin: true });
});

describe('UsersController.getUsers', () => {
    it('denies access for non-admin', async () => {
        const res = createMockRes();
        await UsersController.getUsers(createReq({ decodedToken: { admin: false } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns users', async () => {
        const users = [{ UID: 1 }];
        mockUsers.findAll.mockResolvedValue(users);
        const res = createMockRes();
        await UsersController.getUsers(createReq(), res);
        expect(res.json).toHaveBeenCalledWith(users);
    });

    it('handles errors', async () => {
        mockUsers.findAll.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await UsersController.getUsers(createReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('UsersController.createUser', () => {
    it('denies non-admin', async () => {
        const res = createMockRes();
        await UsersController.createUser(createReq({ decodedToken: { admin: false } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 when login exists', async () => {
        mockUsers.findOne.mockResolvedValueOnce({ UID: 1 });
        const res = createMockRes();
        await UsersController.createUser(createReq({ body: { login: 'user' } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates new user', async () => {
        mockUsers.findOne.mockResolvedValueOnce(null);
        const newUser = { UID: 2 };
        mockUsers.create.mockResolvedValue(newUser);
        const res = createMockRes();
        await UsersController.createUser(createReq({ body: { login: 'user', passwd: 'pass' } }), res);
        expect(bcrypt.hashSync).toHaveBeenCalledWith('pass', 10);
        expect(mockUsers.create).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(newUser);
    });

    it('handles creation errors', async () => {
        mockUsers.findOne.mockResolvedValueOnce(null);
        mockUsers.create.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await UsersController.createUser(createReq({ body: { login: 'user', passwd: 'pass' } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('UsersController.loginUser', () => {
    it('authenticates user and sets cookie', async () => {
        const user = { UID: 2, passwd: 'hashed', email: 'e', login: 'l', PersonalSettings_json: {} };
        mockUsers.findOne.mockResolvedValueOnce(user);
        mockMapsAndElements.findAll.mockResolvedValueOnce([{ EID: 1 }]);
        mockGroups.findAll.mockResolvedValueOnce([{ GID: 1 }]);
        const res = createMockRes();
        await UsersController.loginUser(createReq({ body: { login: 'l', passwd: 'p' } }), res);
        expect(res.cookie).toHaveBeenCalledWith('WarehouseLogisticsToken', 'signed-token', expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 401 when user missing', async () => {
        mockUsers.findOne.mockResolvedValueOnce(null);
        const res = createMockRes();
        await UsersController.loginUser(createReq({ body: { login: 'l', passwd: 'p' } }), res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 on invalid password', async () => {
        const user = { UID: 2, passwd: 'hashed' };
        mockUsers.findOne.mockResolvedValueOnce(user);
        bcrypt.compareSync.mockReturnValue(false);
        const res = createMockRes();
        await UsersController.loginUser(createReq({ body: { login: 'l', passwd: 'p' } }), res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when user has no maps', async () => {
        const user = { UID: 2, passwd: 'hashed' };
        mockUsers.findOne.mockResolvedValueOnce(user);
        mockMapsAndElements.findAll.mockResolvedValueOnce([]);
        const res = createMockRes();
        await UsersController.loginUser(createReq({ body: { login: 'l', passwd: 'p' } }), res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('handles errors', async () => {
        mockUsers.findOne.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await UsersController.loginUser(createReq({ body: { login: 'l', passwd: 'p' } }), res);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});

describe('UsersController.refreshToken', () => {
    it('returns 401 without token', async () => {
        const res = createMockRes();
        await UsersController.refreshToken(createReq({ cookies: {} }), res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('refreshes token', async () => {
        mockMapsAndElements.findAll.mockResolvedValueOnce([{ EID: 1 }]);
        mockGroups.findAll.mockResolvedValueOnce([]);
        mockUsers.findOne.mockResolvedValueOnce({ PersonalSettings_json: {} });
        const res = createMockRes();
        await UsersController.refreshToken(createReq({ cookies: { WarehouseLogisticsToken: 'old' } }), res);
        expect(res.clearCookie).toHaveBeenCalledWith('WarehouseLogisticsToken');
        expect(res.cookie).toHaveBeenCalledWith('WarehouseLogisticsToken', 'signed-token', expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles errors', async () => {
        mockMapsAndElements.findAll.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await UsersController.refreshToken(createReq({ cookies: { WarehouseLogisticsToken: 'old' } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('UsersController.logoutUser', () => {
    it('clears cookie and responds', () => {
        const res = createMockRes();
        UsersController.logoutUser(createReq(), res);
        expect(res.clearCookie).toHaveBeenCalledWith('WarehouseLogisticsToken');
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

describe('UsersController.getUserById', () => {
    it('denies non-admin', async () => {
        const res = createMockRes();
        await UsersController.getUserById(createReq({ decodedToken: { admin: false } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns user', async () => {
        const user = { UID: 2 };
        mockUsers.findOne.mockResolvedValueOnce(user);
        const res = createMockRes();
        await UsersController.getUserById(createReq({ params: { id: 2 } }), res);
        expect(res.json).toHaveBeenCalledWith(user);
    });

    it('handles errors', async () => {
        mockUsers.findOne.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await UsersController.getUserById(createReq({ params: { id: 2 } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('UsersController.updateUser', () => {
    it('denies when not admin and not same user', async () => {
        const res = createMockRes();
        await UsersController.updateUser(createReq({ decodedToken: { UID: 3, admin: false }, params: { id: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('prevents same user from changing login without admin rights', async () => {
        const res = createMockRes();
        await UsersController.updateUser(
            createReq({ decodedToken: { UID: 1, admin: false }, params: { id: 1 }, body: { login: 'new' } }),
            res
        );
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('updates user and hashes password', async () => {
        mockUsers.update.mockResolvedValue([1]);
        const res = createMockRes();
        await UsersController.updateUser(
            createReq({ params: { id: 2 }, body: { passwd: 'newpass', login: 'admin' } }),
            res
        );
        expect(bcrypt.hashSync).toHaveBeenCalledWith('newpass', 10);
        expect(mockUsers.update).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith([1]);
    });

    it('handles errors', async () => {
        mockUsers.update.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await UsersController.updateUser(createReq({ params: { id: 2 }, body: {} }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('UsersController.deleteUser', () => {
    it('denies non-admin', async () => {
        const res = createMockRes();
        await UsersController.deleteUser(createReq({ decodedToken: { admin: false } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('prevents self deletion', async () => {
        const res = createMockRes();
        await UsersController.deleteUser(createReq({ params: { id: 1 }, decodedToken: { admin: true, UID: 1 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('prevents removing main admin', async () => {
        const res = createMockRes();
        await UsersController.deleteUser(createReq({ params: { id: 1 }, decodedToken: { admin: true, UID: 2 } }), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deletes user', async () => {
        mockUsers.destroy.mockResolvedValue(1);
        const res = createMockRes();
        await UsersController.deleteUser(createReq({ params: { id: 5 }, decodedToken: { admin: true, UID: 2 } }), res);
        expect(mockUsers.destroy).toHaveBeenCalledWith({ where: { UID: 5 } });
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
    });

    it('handles errors', async () => {
        mockUsers.destroy.mockRejectedValue(new Error('fail'));
        const res = createMockRes();
        await UsersController.deleteUser(createReq({ params: { id: 5 }, decodedToken: { admin: true, UID: 2 } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
