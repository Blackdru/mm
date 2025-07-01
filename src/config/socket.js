import { io } from 'socket.io-client';

const SOCKET_URL = __DEV__ 
  ? 'http://localhost:3001' 
  : 'https://your-production-server.com';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connection status management
export const socketManager = {
  isConnected: false,
  
  onConnect: (callback) => {
    socket.on('connect', () => {
      socketManager.isConnected = true;
      callback();
    });
  },
  
  onDisconnect: (callback) => {
    socket.on('disconnect', () => {
      socketManager.isConnected = false;
      callback();
    });
  },
  
  onError: (callback) => {
    socket.on('error', callback);
  }
};