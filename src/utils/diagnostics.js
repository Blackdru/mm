// Diagnostic utilities for troubleshooting API issues
import config from '../config/config';

export const runDiagnostics = async () => {
  console.log('🔍 Running API Diagnostics...\n');
  
  // Test 1: Check configuration
  console.log('1. Configuration Check:');
  console.log(`   API Base URL: ${config.API_BASE_URL}`);
  console.log(`   Server URL: ${config.SERVER_URL}`);
  console.log(`   Environment: ${__DEV__ ? 'Development' : 'Production'}`);
  
  // Test 2: Health check
  console.log('\n2. Health Check:');
  try {
    const response = await fetch(`${config.SERVER_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Server is reachable');
      console.log(`   ✅ Server status: ${data.status}`);
      console.log(`   ✅ Server uptime: ${Math.round(data.uptime)}s`);
    } else {
      console.log(`   ❌ Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
    console.log('   💡 Check if backend server is running');
  }
  
  // Test 3: API endpoint test
  console.log('\n3. API Endpoint Test:');
  try {
    const response = await fetch(`${config.API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: '+918888888888',
        otp: '123456',
        referralCode: 'INVALID'
      }),
      timeout: 5000
    });
    
    const data = await response.json();
    
    if (data.message && data.message.includes('referral code format')) {
      console.log('   ✅ API endpoint is working');
      console.log('   ✅ Referral validation is working');
    } else {
      console.log(`   ⚠️ Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log(`   ❌ API test failed: ${error.message}`);
    console.log('   💡 Check network connectivity to API');
  }
  
  // Test 4: Referral code validation
  console.log('\n4. Referral Code Validation Test:');
  const testCodes = [
    { code: 'BZ0L3075', expected: 'valid' },
    { code: 'BZTEST01', expected: 'valid' },
    { code: 'INVALID', expected: 'invalid' },
    { code: 'BZ1', expected: 'invalid' },
    { code: '', expected: 'valid' }
  ];
  
  const pattern = /^BZ[A-Z0-9]{4,8}$/;
  
  testCodes.forEach(test => {
    const isValid = test.code === '' || pattern.test(test.code);
    const expectedValid = test.expected === 'valid';
    const status = isValid === expectedValid ? '✅' : '❌';
    
    console.log(`   ${status} "${test.code}" → ${isValid ? 'Valid' : 'Invalid'} (expected: ${test.expected})`);
  });
  
  console.log('\n📋 Diagnostic Summary:');
  console.log('If all tests pass, the system is working correctly.');
  console.log('If health check fails, start the backend server.');
  console.log('If API test fails, check network connectivity.');
  console.log('If validation fails, check referral code format.');
};

export const testReferralCode = (code) => {
  console.log(`🧪 Testing referral code: "${code}"`);
  
  if (!code || code.trim() === '') {
    console.log('✅ Empty referral code is allowed');
    return true;
  }
  
  const pattern = /^BZ[A-Z0-9]{4,8}$/;
  const isValid = pattern.test(code);
  
  if (isValid) {
    console.log('✅ Referral code format is valid');
  } else {
    console.log('❌ Invalid referral code format');
    console.log('💡 Format should be: BZ followed by 4-10 alphanumeric characters');
    console.log('💡 Examples: BZ1234, BZTEST01, BZABC123');
  }
  
  return isValid;
};

export const getNetworkInfo = () => {
  return {
    apiUrl: config.API_BASE_URL,
    serverUrl: config.SERVER_URL,
    environment: __DEV__ ? 'development' : 'production',
    timestamp: new Date().toISOString()
  };
};