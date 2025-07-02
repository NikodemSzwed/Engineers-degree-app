const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const testAuthentication = require('./database/authTest');
const migrate = require('./database/migrate');
const seed = require('./database/seed');
require('dotenv').config();

const corsBody = {
    exposedHeaders: ['Content-Type', 'Content-Disposition'],
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://192.168.0.157:3000',
        'http://192.168.0.157:5173',
    ],
    credentials: true,
};

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsBody));
const io = new Server(server, {
    cors: corsBody,
});

io.on('connection', socket => {
    // socket.on('join', ({ hallId }) => {
    //     socket.join(hallId);
    console.log(`Socket ${socket.id}`);
    // });
});

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
    /\/displays\/remote\/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;
const excludedRoutes = ['/users/login', '/users/refresh', '/users/logout', '/displays/register', displayRemoteRegex];

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
