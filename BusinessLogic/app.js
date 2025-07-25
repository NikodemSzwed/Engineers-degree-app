const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const testAuthentication = require('./database/authTest');
const migrate = require('./database/migrate');
const seed = require('./database/seed');
const { server, app } = require('./server/server');
require('dotenv').config();

testAuthentication()
    .then(() => migrate())
    .then(() => seed());

const verifyJWT = (req, res, next) => {
    const token = req.cookies['WarehouseLogisticsToken'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.decodedToken = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
const displayRemoteRegex =
    /\/displays\/remote(\/createAlert)?\/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;
const excludedRoutes = [
    '/users/login',
    '/users/refresh',
    '/users/logout',
    '/displays/register',
    '/displays/login',
    displayRemoteRegex,
];

app.use((req, res, next) => {
    if (
        excludedRoutes.some(
            route =>
                (typeof route === 'string' && req.path.endsWith(route)) ||
                (route instanceof RegExp && route.test(req.path))
        )
    ) {
        return next();
    }
    verifyJWT(req, res, next);
});

const routesPath = path.join(__dirname, 'routes');

fs.readdirSync(routesPath).forEach(file => {
    const route = require(path.join(routesPath, file));
    const routeName = `/api/${file.split('.js')[0]}`;
    app.use(routeName, route);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
