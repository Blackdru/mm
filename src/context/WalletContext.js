import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import config from '../config/config';

const WalletContext = createContext();

const initialState = {
  balance: 0,
  gameBalance: 0,
  withdrawableBalance: 0,
  transactions: [],
  loading: false,
  razorpayKey: null,
};

const walletReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_BALANCE':
      return {
        ...state,
        balance: action.payload.balance || 0,
        gameBalance: action.payload.gameBalance || 0,
        withdrawableBalance: action.payload.withdrawableBalance || 0,
      };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'SET_RAZORPAY_KEY':
      return { ...state, razorpayKey: action.payload };
    case 'UPDATE_BALANCE':
      return { ...state, balance: state.balance + action.payload };
    default:
      return state;
  }
};

export const WalletProvider = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchBalance();
      fetchRazorpayKey();
      // Don't auto-fetch transactions to avoid 404 errors
      // fetchTransactions will be called manually when needed
    }
  }, [isAuthenticated, token]);

  const fetchBalance = async () => {
    try {
      if (!token) return;

      const response = await fetch(`${config.API_BASE_URL}/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        console.log('Wallet API data:', data);
        const walletData = data.wallet || data;
        dispatch({
          type: 'SET_BALANCE',
          payload: {
            balance: Number(walletData.balance) || 0,
            gameBalance: Number(walletData.gameBalance) || 0,
            withdrawableBalance: Number(walletData.withdrawableBalance) || 0,
          },
        });
      } else {
        dispatch({ type: 'SET_BALANCE', payload: { balance: 0, gameBalance: 0, withdrawableBalance: 0 } });
      }
    } catch (error) {
      console.error('Fetch balance error:', error);
      dispatch({ type: 'SET_BALANCE', payload: { balance: 0, gameBalance: 0, withdrawableBalance: 0 } });
    }
  };

  const fetchTransactions = async (page = 1, limit = 20) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (!token) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
        return;
      }

      const response = await fetch(
        `${config.API_BASE_URL}/wallet/transactions?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.transactions)) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: data.transactions });
      } else {
        dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchRazorpayKey = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/payment/razorpay-key`);
      const data = await response.json();
      if (response.ok && data.success) {
        dispatch({ type: 'SET_RAZORPAY_KEY', payload: data.key });
      }
    } catch (error) {
      console.error('Fetch Razorpay key error:', error);
    }
  };

  const createDepositOrder = async (amount) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          orderId: data.order.id,
          order: data.order,
        };
      } else {
        throw new Error(data.message || 'Failed to create deposit order');
      }
    } catch (error) {
      console.error('Create deposit order error:', error);
      return { success: false, message: error.message };
    }
  };

  const verifyDeposit = async (paymentData) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/wallet/deposit/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({
          type: 'SET_BALANCE',
          payload: {
            balance: data.balance || 0,
            gameBalance: data.gameBalance || 0,
            withdrawableBalance: data.withdrawableBalance || 0,
          },
        });
        fetchTransactions();
      }

      return data;
    } catch (error) {
      console.error('Verify deposit error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const createWithdrawal = async (amount, withdrawalDetails) => {
    try {
      if (!token) return { success: false, message: 'Authentication required' };

      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 100) {
        return { success: false, message: 'Minimum withdrawal amount is ₹100' };
      }

      if (!withdrawalDetails || !withdrawalDetails.method || !withdrawalDetails.details) {
        return { success: false, message: 'Withdrawal details are required' };
      }

      const response = await fetch(`${config.API_BASE_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numericAmount,
          withdrawalDetails: withdrawalDetails,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({ type: 'UPDATE_BALANCE', payload: -numericAmount });
        dispatch({
          type: 'ADD_TRANSACTION',
          payload: {
            id: data.transactionId || Date.now().toString(),
            type: 'WITHDRAWAL',
            amount: -numericAmount,
            description: `Withdrawal request - ${withdrawalDetails.method.toUpperCase()}`,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          },
        });

        setTimeout(fetchBalance, 1000);
      }

      return data;
    } catch (error) {
      console.error('Create withdrawal error:', error);
      return { success: false, message: error.message || 'Network error' };
    }
  };

  const addTransaction = async (transactionData) => {
    try {
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: {
          id: Date.now().toString(),
          ...transactionData,
          createdAt: new Date().toISOString(),
        },
      });

      await fetchBalance();
      await fetchTransactions();

      return { success: true };
    } catch (error) {
      console.error('Add transaction error:', error);
      return { success: false, message: 'Failed to add transaction' };
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
        addTransaction,
      }}
    >
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