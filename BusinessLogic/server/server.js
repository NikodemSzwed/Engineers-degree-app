const express = require('express');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const models = require('../database/getModels.js')();
const MapsAndElements = models.MapsAndElements;

const app = express();
const server = http.createServer(app);
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

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsBody));

const io = new Server(server, {
    cors: corsBody,
});

io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return next(new Error('No cookies sent'));

    const parsed = cookie.parse(cookies);
    const token = parsed['WarehouseLogisticsToken'];
    if (!token) return next(new Error('No token in cookie'));

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        socket.userToken = user;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', socket => {
    socket.on('join-display', async roomId => {
        const token = socket.userToken;

        if (!socket.rooms.has(roomId) && 'display-' + token.displayUUID === roomId) {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        }
    });

    socket.on('join-all', async () => {
        const allowedEIDs = socket.userToken.userEIDs;

        allowedEIDs.forEach(EID => {
            if (!socket.rooms.has('EID-' + EID)) {
                socket.join('EID-' + EID);
                console.log(`Socket ${socket.id} joined room ${'EID-' + EID}`);
            }
        });
    });

    socket.on('join', async roomId => {
        const allowedEIDs = socket.userToken.displayEIDs;

        const parsed = roomId.match(/^EID-(\d+)$/);
        const eid = parsed ? parseInt(parsed[1], 10) : null;
        if (eid === null) return;

        const elements = await findObjectAndParents(eid);

        const isAllowed = allowedEIDs.some(allowedEID => elements.some(element => element.EID === allowedEID));

        if (!socket.rooms.has(roomId) && isAllowed) {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        }
    });

    socket.on('leave', roomId => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} stopped listening for updates on ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected`);
    });
});

async function findObjectAndParents(EID) {
    const query = `
        WITH RECURSIVE MapElements AS (
            SELECT * FROM MapsAndElements WHERE EID = :EID 
            UNION ALL
            SELECT me.* FROM MapsAndElements me
            INNER JOIN MapElements ON me.EID = MapElements.ParentEID
        )
        SELECT * FROM MapElements;
        `;

    const rawData = await db.query(query, {
        replacements: { EID: EID },
        type: db.QueryTypes.SELECT,
    });
    const elements = rawData.map(row => MapsAndElements.build(row, { isNewRecord: false }));

    return elements;
}

module.exports = { app, server, io, findObjectAndParents };
