import { io } from 'socket.io-client';

// התחברות לשרת Socket.IO
const token = localStorage.getItem("token");

export const socket = io("http://localhost:5000", {
  auth: {
    token
  }
});