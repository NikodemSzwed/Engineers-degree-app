const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

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

io.on('connection', socket => {
    socket.on('join', roomId => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} listens for updates on ${roomId}`);
    });

    socket.on('leave', roomId => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} stopped listening for updates on ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected`);
    });
});

module.exports = { app, server, io };
