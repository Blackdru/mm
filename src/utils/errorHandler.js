import { Alert } from 'react-native';

/**
 * Centralized error handling utility for the frontend
 */
class ErrorHandler {
  static handleApiError(error, context = 'API') {
    console.error(`${context} Error:`, error);
    
    let message = 'Something went wrong. Please try again.';
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          message = data.message || 'Invalid request. Please check your input.';
          break;
        case 401:
          message = 'Session expired. Please login again.';
          break;
        case 403:
          message = 'Access denied. You don\'t have permission for this action.';
          break;
        case 404:
          message = 'Resource not found. Please try again.';
          break;
        case 429:
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = data.message || `Server error (${status}). Please try again.`;
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your internet connection.';
    } else if (error.message) {
      // Other error with message
      message = error.message;
    }
    
    return {
      success: false,
      message,
      error: error
    };
  }
  
  static handleSocketError(error, context = 'Socket') {
    console.error(`${context} Error:`, error);
    
    let message = 'Connection error. Please try again.';
    
    if (error.type === 'TransportError') {
      message = 'Connection failed. Please check your internet connection.';
    } else if (error.description) {
      message = error.description;
    } else if (error.message) {
      message = error.message;
    }
    
    return {
      success: false,
      message,
      error: error
    };
  }
  
  static showAlert(title, message, buttons = null) {
    Alert.alert(
      title,
      message,
      buttons || [{ text: 'OK', style: 'default' }],
      { cancelable: true }
    );
  }
  
  static showErrorAlert(message, title = 'Error') {
    this.showAlert(title, message);
  }
  
  static showSuccessAlert(message, title = 'Success') {
    this.showAlert(title, message);
  }
  
  static showConfirmAlert(message, onConfirm, onCancel = null, title = 'Confirm') {
    this.showAlert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'OK', style: 'default', onPress: onConfirm }
    ]);
  }
  
  static logError(error, context = 'App') {
    console.error(`[${context}] Error:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
  
  static handleAsyncError(asyncFunction, context = 'Async') {
    return async (...args) => {
      try {
        return await asyncFunction(...args);
      } catch (error) {
        this.logError(error, context);
        throw error;
      }
    };
  }
}

export default ErrorHandler;