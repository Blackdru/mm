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

// Enhanced connection event handlers
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  socket.emit('ping'); // Send ping to verify connection
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
  if (reason === 'io server disconnect') {
    // Server disconnected the socket, reconnect manually
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
  console.log('🔄 Retrying connection...');
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_error', (error) => {
  console.error('❌ Socket reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('❌ Socket reconnection failed');
});

// Add error handling for socket events
socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Handle server errors
socket.on('serverError', (error) => {
  console.error('❌ Server error:', error);
});

// Cleanup function
export const cleanupSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
  socket.removeAllListeners();
};