import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const WelcomeBonusPopup = ({ visible, onClose }) => {
  const scaleValue = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.spring(scaleValue, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.popup,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}>
          
          {/* Celebration Header */}
          <View style={styles.header}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.congratsText}>Congratulations!</Text>
            <Text style={styles.celebrationEmoji}>🎉</Text>
          </View>

          {/* Bonus Amount */}
          <View style={styles.bonusContainer}>
            <View style={styles.bonusAmountContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.bonusAmount}>10</Text>
            </View>
            <Text style={styles.bonusLabel}>Welcome Bonus Credited!</Text>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Your account has been credited with ₹10 as a welcome bonus!
            </Text>
            <Text style={styles.encouragementText}>
              Don't waste your time, go play and win more! 🚀
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.playButton} onPress={handleClose}>
            <Text style={styles.playButtonText}>🎮 Let's Play!</Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  popup: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    width: width * 0.9,
    maxWidth: 350,
    alignItems: 'center',
    ...theme.shadows.large,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  celebrationEmoji: {
    fontSize: 32,
    marginHorizontal: theme.spacing.sm,
  },
  congratsText: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  
  bonusContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
    ...theme.shadows.successShadow,
  },
  bonusAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.xs,
  },
  bonusAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  bonusLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  messageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  messageText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  encouragementText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  
  playButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    ...theme.shadows.primaryShadow,
  },
  playButtonText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
});

export default WelcomeBonusPopup;