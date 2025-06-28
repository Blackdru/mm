// Simple connection test for React Native app
import { Platform } from 'react-native';

const COMPUTER_IP = '192.168.126.58';

// Test URLs
const testUrls = {
  'Android Emulator': 'http://10.0.2.2:8080',
  'iOS Simulator': 'http://localhost:8080', 
  'Physical Device': `http://${COMPUTER_IP}:8080`,
  'Manual Test': 'http://192.168.126.58:8080'
};

console.log('🧪 Connection Test Starting...');
console.log('Platform:', Platform.OS);
console.log('');

// Test each URL
Object.entries(testUrls).forEach(([name, url]) => {
  console.log(`Testing ${name}: ${url}`);
  
  fetch(`${url}/health`, {
    method: 'GET',
    timeout: 5000
  })
  .then(response => {
    if (response.ok) {
      console.log(`✅ ${name}: SUCCESS`);
      return response.json();
    } else {
      console.log(`❌ ${name}: HTTP ${response.status}`);
    }
  })
  .then(data => {
    if (data) {
      console.log(`   Server Status: ${data.status}`);
    }
  })
  .catch(error => {
    console.log(`❌ ${name}: FAILED - ${error.message}`);
  });
});

// Test Socket.IO connection
console.log('\n🔌 Testing Socket.IO Connection...');

const io = require('socket.io-client');
const socketUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : `http://${COMPUTER_IP}:8080`;

console.log(`Socket URL: ${socketUrl}`);

const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Socket.IO: CONNECTED');
  socket.disconnect();
});

socket.on('connect_error', (error) => {
  console.log('❌ Socket.IO: CONNECTION FAILED');
  console.log('Error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket.IO: DISCONNECTED -', reason);
});

// Timeout test
setTimeout(() => {
  if (!socket.connected) {
    console.log('⏰ Socket.IO: CONNECTION TIMEOUT');
    socket.disconnect();
  }
}, 10000);