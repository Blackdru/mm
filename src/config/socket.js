import { io } from 'socket.io-client';
import config from './config';

const SOCKET_URL = config.SERVER_URL;

export const socket = io(SOCKET_URL, {
  ...config.SOCKET_CONFIG,
  autoConnect: false,
  transports: ['polling', 'websocket'], // Use polling first for better compatibility
  upgrade: true,
  rememberUpgrade: true,
});

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
});