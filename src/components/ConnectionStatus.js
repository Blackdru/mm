import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const ConnectionStatus = ({ showOnlyInGame = false }) => {
  const { connectionStatus, error } = useGame();
  const { isAuthenticated } = useAuth();
  const [pulseAnim] = React.useState(new Animated.Value(1));

  // Always call hooks first, then handle early returns
  React.useEffect(() => {
    if (connectionStatus === 'connecting') {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (connectionStatus === 'connecting') {
            pulse();
          }
        });
      };
      pulse();
    }
  }, [connectionStatus, pulseAnim]);

  // Don't show connection status on auth screen or when not authenticated
  if (!isAuthenticated && showOnlyInGame) {
    return null;
  }

  if (connectionStatus === 'connected' && !error) {
    return null; // Don't show anything when connected and no errors
  }

  const getStatusConfig = () => {
    if (error) {
      return {
        icon: '⚠️',
        text: error,
        color: theme.colors.danger,
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
      };
    }

    switch (connectionStatus) {
      case 'connecting':
        return {
          icon: '🔄',
          text: 'Connecting to game server...',
          color: theme.colors.warning,
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
        };
      case 'disconnected':
        return {
          icon: '📡',
          text: 'Connection lost - Attempting to reconnect...',
          color: theme.colors.danger,
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: config.backgroundColor },
        connectionStatus === 'connecting' && { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.text, { color: config.color }]}>
        {config.text}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  text: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500',
    flex: 1,
  },
});

export default ConnectionStatus;