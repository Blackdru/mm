import React, {useState, useEffect} from 'react';
import {StatusBar, Alert, View, Text, ActivityIndicator, StyleSheet, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import PlayerSelectionScreen from './src/screens/PlayerSelectionScreen';
import AmountSelectionScreen from './src/screens/AmountSelectionScreen';
import MatchmakingScreen from './src/screens/MatchmakingScreen';
import MemoryGameScreen from './src/screens/MemoryGame';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReferralScreen from './src/screens/ReferralScreen';

// Context
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {GameProvider} from './src/context/GameContext';
import {WalletProvider} from './src/context/WalletContext';

// Components
import ErrorBoundary from './src/components/ErrorBoundary';
import ConnectionStatus from './src/components/ConnectionStatus';

// Theme
import { theme } from './src/styles/theme';
import GradientBackground from './src/components/GradientBackground';

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
      case 'PlayerSelection':
        return <PlayerSelectionScreen navigation={{navigate}} route={{params: screenParams}} />;
      case 'AmountSelection':
        return <AmountSelectionScreen navigation={{navigate}} route={{params: screenParams}} />;
      case 'Matchmaking':
        return <MatchmakingScreen navigation={{navigate}} route={{params: screenParams}} />;
      case 'MemoryGame':
        return <MemoryGameScreen navigation={{navigate}} route={{params: screenParams}} />;
      case 'Wallet':
        return <WalletScreen navigation={{navigate}} />;
      case 'Profile':
        return <ProfileScreen navigation={{navigate}} />;
      case 'Referral':
        return <ReferralScreen navigation={{navigate}} />;
      default:
        return <HomeScreen navigation={{navigate}} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.background}
        translucent={true}
      />
      <SafeAreaView style={styles.safeArea}>
        <GradientBackground>
          <ConnectionStatus />
          <ErrorBoundary navigation={{navigate}}>
            {renderScreen()}
          </ErrorBoundary>
        </GradientBackground>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  text: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
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