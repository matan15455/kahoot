// frontend/src/socket.js
import { io } from 'socket.io-client';

// התחברות לשרת Socket.IO
export const socket = io('http://localhost:5000');

// אפשר להוסיף כאן פונקציות עזר למשל:
// export const joinRoom = (code, name) => socket.emit('joinRoom', { code, playerName: name });
// export const createRoom = (hostName, game) => socket.emit('createRoom', { hostName, game });