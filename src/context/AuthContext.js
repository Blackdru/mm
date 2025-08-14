import React, {createContext, useContext, useReducer, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';
import { makeApiRequest, handleApiError, validateResponse } from '../utils/apiUtils';
import deviceUtils from '../utils/deviceUtils';
import versionUtils from '../utils/versionUtils';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {...state, loading: action.payload};
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: {...state.user, ...action.payload},
      };
    default:
      return state;
  }
};

export const AuthProvider = ({children}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check if force logout is required due to app update
      const shouldForceLogout = await versionUtils.checkForceLogout();
      
      if (shouldForceLogout) {
        console.log('Force logout required - clearing auth data');
        await versionUtils.clearAuthDataForUpdate();
        dispatch({type: 'SET_LOADING', payload: false});
        return;
      }

      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        const user = JSON.parse(userData);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {user, token},
        });
      } else {
        dispatch({type: 'SET_LOADING', payload: false});
      }
    } catch (error) {
      console.error('Auth state check error:', error);
      dispatch({type: 'SET_LOADING', payload: false});
    }
  };

  const sendOTP = async (phoneNumber) => {
    try {
      console.log('Sending OTP to:', phoneNumber);
      console.log('API URL:', `${config.API_BASE_URL}/auth/send-otp`);
      
      const data = await makeApiRequest(`${config.API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        body: JSON.stringify({phoneNumber}),
      });

      console.log('Send OTP response:', data);
      return validateResponse(data);
    } catch (error) {
      return handleApiError(error);
    }
  };

  const verifyOTP = async (phoneNumber, otp, referralCode = null) => {
    try {
      console.log('Verifying OTP for:', phoneNumber, 'OTP:', otp, 'Referral:', referralCode);
      
      // Get device ID
      const deviceId = await deviceUtils.getDeviceId();
      console.log('Device ID:', deviceId);
      
      const requestBody = { phoneNumber, otp, deviceId };
      if (referralCode) {
        requestBody.referralCode = referralCode;
      }
      
      const data = await makeApiRequest(`${config.API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('Verify OTP response:', data);

      if (data.success) {
        // Store auth data
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        // Store welcome bonus flag if present
        if (data.hasWelcomeBonus) {
          await AsyncStorage.setItem('showWelcomeBonus', 'true');
        }

        // Update app version after successful login
        await versionUtils.updateAppVersion();

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {user: data.user, token: data.token},
        });
        
        console.log('User authenticated successfully:', data.user.id);
      }

      return validateResponse(data);
    } catch (error) {
      return handleApiError(error);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        dispatch({type: 'UPDATE_USER', payload: data.user});
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      return {success: false, message: 'Network error. Please try again.'};
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      dispatch({type: 'LOGOUT'});
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshToken = async () => {
    try {
      // Get device ID for verification
      const deviceId = await deviceUtils.getDeviceId();
      
      const response = await fetch(`${config.API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ deviceId }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {user: data.user, token: data.token},
        });
      } else if (response.status === 403) {
        // Device verification failed - force logout
        console.log('Device verification failed during token refresh - logging out');
        await logout();
        return { success: false, message: 'Device verification failed. Please log in again.', forceLogout: true };
      }

      return data;
    } catch (error) {
      console.error('Refresh token error:', error);
      return {success: false, message: 'Failed to refresh token'};
    }
  };

  const getToken = async () => {
    try {
      // First try to get from state
      if (state.token) {
        return state.token;
      }
      
      // Fallback to AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        sendOTP,
        verifyOTP,
        updateProfile,
        logout,
        refreshToken,
        getToken,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};