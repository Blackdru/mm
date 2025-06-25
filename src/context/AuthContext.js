import React, {createContext, useContext, useReducer, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

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
      const response = await fetch(`${config.API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({phoneNumber}),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Send OTP error:', error);
      return {success: false, message: 'Network error. Please try again.'};
    }
  };

  const verifyOTP = async (phoneNumber, otp) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({phoneNumber, otp}),
      });

      const data = await response.json();

      if (data.success) {
        // Store auth data
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {user: data.user, token: data.token},
        });
      }

      return data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {success: false, message: 'Network error. Please try again.'};
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
      const response = await fetch(`${config.API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {user: data.user, token: data.token},
        });
      }

      return data;
    } catch (error) {
      console.error('Refresh token error:', error);
      return {success: false, message: 'Failed to refresh token'};
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