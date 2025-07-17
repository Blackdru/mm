import React, {useState, useEffect} from 'react';
import {StatusBar, Alert, View, Text, ActivityIndicator, StyleSheet, Platform, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import UserConsentScreen from './src/screens/UserConsentScreen';
import ReferralCodeScreen from './src/screens/ReferralCodeScreen';
import HomeScreen from './src/screens/HomeScreen';
import PlayerSelectionScreen from './src/screens/PlayerSelectionScreen';
import AmountSelectionScreen from './src/screens/AmountSelectionScreen';
import MatchmakingScreen from './src/screens/MatchmakingScreen';
import MemoryGameScreen from './src/screens/MemoryGame';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReferralScreen from './src/screens/ReferralScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FAQScreen from './src/screens/FAQScreen';
import AboutScreen from './src/screens/AboutScreen';

// Context
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {GameProvider} from './src/context/GameContext';
import {WalletProvider} from './src/context/WalletContext';

// Components
import ErrorBoundary from './src/components/ErrorBoundary';
import ConnectionStatus from './src/components/ConnectionStatus';
import UpdateChecker from './src/components/UpdateChecker';

// Theme
import { theme } from './src/styles/theme';
import GradientBackground from './src/components/GradientBackground';

// Socket cleanup
import { cleanupSocket } from './src/config/socket';

const AppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('Auth');
  const [screenParams, setScreenParams] = useState({});
  const {user, loading, isAuthenticated} = useAuth();

  const navigate = (screenName, params = {}) => {
    setCurrentScreen(screenName);
    setScreenParams(params);
  };

  const goBack = () => {
    // Simple back navigation - go to Home for now
    // In a real app, you'd maintain a navigation stack
    setCurrentScreen('Home');
    setScreenParams({});
  };

  // Screens that should show connection status
  const gameScreens = ['Matchmaking', 'MemoryGame', 'PlayerSelection', 'AmountSelection'];
  const shouldShowConnectionStatus = isAuthenticated && gameScreens.includes(currentScreen);

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
        return <AuthScreen navigation={{navigate, goBack}} />;
      case 'UserConsent':
        return <UserConsentScreen navigation={{navigate, goBack}} route={{params: screenParams}} />;
      case 'ReferralCode':
        return <ReferralCodeScreen navigation={{navigate, goBack}} route={{params: screenParams}} />;
      case 'Home':
        return <HomeScreen navigation={{navigate, goBack}} />;
      case 'PlayerSelection':
        return <PlayerSelectionScreen navigation={{navigate, goBack}} route={{params: screenParams}} />;
      case 'AmountSelection':
        return <AmountSelectionScreen navigation={{navigate, goBack}} route={{params: screenParams}} />;
      case 'Matchmaking':
        return <MatchmakingScreen navigation={{navigate, goBack}} route={{params: screenParams}} />;
      case 'MemoryGame':
        return <MemoryGameScreen navigation={{navigate, goBack}} route={{params: screenParams}} />;
      case 'Wallet':
        return <WalletScreen navigation={{navigate, goBack}} />;
      case 'Profile':
        return <ProfileScreen navigation={{navigate, goBack}} />;
      case 'Referral':
        return <ReferralScreen navigation={{navigate, goBack}} />;
      case 'Settings':
        return <SettingsScreen navigation={{navigate, goBack}} />;
      case 'FAQ':
        return <FAQScreen navigation={{navigate, goBack}} />;
      case 'About':
        return <AboutScreen navigation={{navigate, goBack}} />;
      default:
        return <HomeScreen navigation={{navigate, goBack}} />;
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
          {shouldShowConnectionStatus && <ConnectionStatus />}
          <ErrorBoundary navigation={{navigate}}>
            {renderScreen()}
          </ErrorBoundary>
          <UpdateChecker />
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
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App going to background, cleaning up connections...');
        // Don't disconnect socket completely, just reduce activity
      } else if (nextAppState === 'active') {
        console.log('App coming to foreground...');
        // Reconnect or refresh connections if needed
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on app unmount
    return () => {
      subscription?.remove();
      try {
        cleanupSocket();
      } catch (error) {
        console.error('Error cleaning up socket:', error);
      }
    };
  }, []);

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