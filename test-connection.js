// Simple connection test script
const { io } = require('socket.io-client');

// Test different connection URLs
const testUrls = [
  'http://localhost:8080',
  'http://10.0.2.2:8080',
  'http://192.168.126.58:8080',
  'https://test.fivlog.space'
];

console.log('🧪 Testing Socket.IO connections...\n');

testUrls.forEach((url, index) => {
  console.log(`${index + 1}. Testing: ${url}`);
  
  const socket = io(url, {
    transports: ['polling', 'websocket'],
    timeout: 10000,
    reconnection: false,
    forceNew: true
  });

  socket.on('connect', () => {
    console.log(`✅ ${url} - CONNECTED`);
    socket.disconnect();
  });

  socket.on('connect_error', (error) => {
    console.log(`❌ ${url} - FAILED: ${error.message}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 ${url} - DISCONNECTED: ${reason}`);
  });

  // Timeout after 10 seconds
  setTimeout(() => {
    if (!socket.connected) {
      console.log(`⏰ ${url} - TIMEOUT`);
      socket.disconnect();
    }
  }, 10000);
});

// Test health endpoint
console.log('\n🏥 Testing health endpoints...\n');

testUrls.forEach(async (url, index) => {
  try {
    const healthUrl = `${url}/health`;
    console.log(`${index + 1}. Testing health: ${healthUrl}`);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${healthUrl} - OK (${data.status})`);
    } else {
      console.log(`❌ ${healthUrl} - HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ ${url}/health - FAILED: ${error.message}`);
  }
});

console.log('\n🔍 Connection test completed. Check the results above.');