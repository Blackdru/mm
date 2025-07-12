import config from '../config/config';
import ErrorHandler from './errorHandler';

/**
 * Network utility for making API requests with proper error handling
 */
class NetworkUtils {
  static async makeRequest(endpoint, options = {}) {
    const url = `${config.API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    try {
      console.log(`🌐 Making ${requestOptions.method} request to: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData
          }
        };
      }
      
      const data = await response.json();
      console.log(`✅ Request successful`);
      
      return {
        success: true,
        data
      };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout');
        return ErrorHandler.handleApiError(
          { message: 'Request timeout. Please try again.' },
          'Network'
        );
      }
      
      console.error('❌ Request failed:', error);
      return ErrorHandler.handleApiError(error, 'Network');
    }
  }
  
  static async get(endpoint, headers = {}) {
    return this.makeRequest(endpoint, {
      method: 'GET',
      headers
    });
  }
  
  static async post(endpoint, data = {}, headers = {}) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
  }
  
  static async put(endpoint, data = {}, headers = {}) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
  }
  
  static async delete(endpoint, headers = {}) {
    return this.makeRequest(endpoint, {
      method: 'DELETE',
      headers
    });
  }
  
  static async authenticatedRequest(endpoint, options = {}, token) {
    const authHeaders = token ? {
      'Authorization': `Bearer ${token}`
    } : {};
    
    return this.makeRequest(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        ...authHeaders
      }
    });
  }
  
  static async testConnection() {
    try {
      console.log('🧪 Testing server connection...');
      const result = await this.get('/health');
      
      if (result.success) {
        console.log('✅ Server connection test successful');
        return true;
      } else {
        console.log('❌ Server connection test failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Server connection test failed:', error);
      return false;
    }
  }
}

export default NetworkUtils;