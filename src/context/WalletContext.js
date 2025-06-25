import React, {createContext, useContext, useReducer, useEffect} from 'react';
import {useAuth} from './AuthContext';
import config from '../config/config';

const WalletContext = createContext();

const initialState = {
  balance: 0,
  transactions: [],
  loading: false,
  razorpayKey: null,
};

const walletReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {...state, loading: action.payload};
    case 'SET_BALANCE':
      return {...state, balance: action.payload};
    case 'SET_TRANSACTIONS':
      return {...state, transactions: action.payload};
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'SET_RAZORPAY_KEY':
      return {...state, razorpayKey: action.payload};
    case 'UPDATE_BALANCE':
      return {...state, balance: state.balance + action.payload};
    default:
      return state;
  }
};

export const WalletProvider = ({children}) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const {token, isAuthenticated} = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchBalance();
      fetchRazorpayKey();
    }
  }, [isAuthenticated, token]);

  const fetchBalance = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/payment/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        dispatch({type: 'SET_BALANCE', payload: data.balance});
      }
    } catch (error) {
      console.error('Fetch balance error:', error);
    }
  };

  const fetchTransactions = async (page = 1, limit = 20) => {
    try {
      dispatch({type: 'SET_LOADING', payload: true});
      
      const response = await fetch(
        `${config.API_BASE_URL}/payment/history?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        dispatch({type: 'SET_TRANSACTIONS', payload: data.transactions});
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
    } finally {
      dispatch({type: 'SET_LOADING', payload: false});
    }
  };

  const fetchRazorpayKey = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/payment/razorpay-key`);
      const data = await response.json();
      if (data.success) {
        dispatch({type: 'SET_RAZORPAY_KEY', payload: data.key});
      }
    } catch (error) {
      console.error('Fetch Razorpay key error:', error);
    }
  };

  const createDepositOrder = async (amount) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/payment/create-deposit-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({amount}),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create deposit order error:', error);
      return {success: false, message: 'Network error. Please try again.'};
    }
  };

  const verifyDeposit = async (paymentData) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/payment/verify-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      
      if (data.success) {
        dispatch({type: 'SET_BALANCE', payload: data.balance});
      }
      
      return data;
    } catch (error) {
      console.error('Verify deposit error:', error);
      return {success: false, message: 'Network error. Please try again.'};
    }
  };

  const createWithdrawal = async (amount, bankDetails) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/payment/create-withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({amount, bankDetails}),
      });

      const data = await response.json();
      
      if (data.success) {
        dispatch({type: 'UPDATE_BALANCE', payload: -amount});
      }
      
      return data;
    } catch (error) {
      console.error('Create withdrawal error:', error);
      return {success: false, message: 'Network error. Please try again.'};
    }
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        fetchBalance,
        fetchTransactions,
        createDepositOrder,
        verifyDeposit,
        createWithdrawal,
      }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};