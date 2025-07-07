// API utility functions for consistent error handling and request management

export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
    return {
      success: false,
      message: 'Network error. Please check your internet connection and try again.'
    };
  }
  
  if (error.code === 'TIMEOUT') {
    return {
      success: false,
      message: 'Request timeout. Please try again.'
    };
  }
  
  // Handle specific referral code errors
  if (error.message && error.message.includes('referral code format')) {
    return {
      success: false,
      message: 'Invalid referral code format. Please enter a code starting with BZ followed by 4-10 characters (e.g., BZ1234).'
    };
  }
  
  if (error.message && error.message.includes('Invalid OTP')) {
    return {
      success: false,
      message: 'Invalid or expired OTP. Please request a new OTP and try again.'
    };
  }
  
  return {
    success: false,
    message: error.message || 'Something went wrong. Please try again.'
  };
};

export const makeApiRequest = async (url, options = {}) => {
  try {
    const defaultOptions = {
      timeout: 15000, // 15 seconds
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);

    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error:', response.status, errorText);
      
      let errorMessage = `Server error (${response.status})`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use default message
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    throw error;
  }
};

export const validateResponse = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format');
  }
  
  if (!data.success) {
    throw new Error(data.message || 'Request failed');
  }
  
  return data;
};

// Retry mechanism for failed requests
export const retryApiRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain types of errors
      if (error.message.includes('401') || error.message.includes('403')) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};