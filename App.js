import React, {useState, useEffect} from 'react';
import {StatusBar, Alert, View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import GameSelectionScreen from './src/screens/GameSelectionScreen';
import PlayerSelectionScreen from './src/screens/PlayerSelectionScreen';
import AmountSelectionScreen from './src/screens/AmountSelectionScreen';
import MatchmakingScreen from './src/screens/MatchmakingScreen';
import GameScreen from './src/screens/GameScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Context
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {GameProvider} from './src/context/GameContext';
import {WalletProvider} from './src/context/WalletContext';

const AppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('Auth');
  const [screenParams, setScreenParams] = useState({});
  const {user, loading} = useAuth();

  const navigate = (screenName, params = {}) => {
    setCurrentScreen(screenName);
    setScreenParams(params);
  };

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Check if user has completed profile (has name)
        if (!user.name || user.name.trim() === '') {
          setCurrentScreen('Profile');
        } else {
          setCurrentScreen('Home');
        }
      } else {
        setCurrentScreen('Auth');
      }
    }
  }, [user, loading]);

  const renderScreen = () => {
    if (loading) {
      return (
        <View style={loadingStyles.container}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={loadingStyles.text}>Loading Budzee...</Text>
        </View>
      );
    }

    switch (currentScreen) {
      case 'Auth':
        return <AuthScreen navigation={{navigate}} />;
      case 'Home':
        return <HomeScreen navigation={{navigate}} />;
      case 'GameSelection':
        return <GameSelectionScreen navigation={{navigate}} />;
      case 'PlayerSelection':
        return <PlayerSelectionScreen navigation={{navigate}} route={{params: screenParams}} />;
      case 'AmountSelection':
        return <AmountSelectionScreen navigation={{navigate}} route={{params: screenParams}} />;
      case 'Matchmaking':
        return <MatchmakingScreen navigation={{navigate}} route={{params: screenParams}} />;
      case 'Game':
        return <GameScreen navigation={{navigate}} route={{params: screenParams}} />;
      case 'Wallet':
        return <WalletScreen navigation={{navigate}} />;
      case 'Profile':
        return <ProfileScreen navigation={{navigate}} />;
      default:
        return <HomeScreen navigation={{navigate}} />;
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {renderScreen()}
    </>
  );
};

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
});

const App = () => {
  return (
    <AuthProvider>
      <WalletProvider>
        <GameProvider>
          <AppNavigator />
        </GameProvider>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App;