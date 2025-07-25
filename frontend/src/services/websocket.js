import { io } from 'socket.io-client';

const hostname = window.location.hostname;

export function connect() {
    let socket = io('http://' + hostname + ':3000', {
        withCredentials: true,
    });
    socket.on('connect_error', err => {
        console.error('Socket connection failed:', err.message);
    });
    return socket;
}
