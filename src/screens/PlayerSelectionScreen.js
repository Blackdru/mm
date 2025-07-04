import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';

const PlayerSelectionScreen = ({navigation, route}) => {
  const {game} = route.params;
  const [selectedPlayers, setSelectedPlayers] = useState(null);

  const playerOptions = [
    {
      count: 2,
      title: '2 Players Battle',
      description: 'Head-to-head memory duel',
      icon: '🧠',
      available: true,
      features: ['Turn-based gameplay', 'Quick 5-min matches', 'Winner takes 80%'],
      difficulty: 'Perfect for beginners',
      estimatedTime: '3-5 minutes'
    }
  ];

  const handlePlayerSelection = (playerCount) => {
    setSelectedPlayers(playerCount);
    navigation.navigate('AmountSelection', {
      game,
      playerCount,
    });
  };

  const handleBackPress = () => {
    navigation.navigate('Home');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <CommonHeader
          title={game.name}
          subtitle="Choose your battle mode"
          icon={game.emoji}
          onBackPress={handleBackPress}
        />
        
        {/* Game Mode Selection */}
        <View style={styles.modeSection}>
          <Text style={styles.sectionTitle}>🎯 Select Battle Mode</Text>
          
          {playerOptions.map((option) => (
            <TouchableOpacity
              key={option.count}
              style={[
                commonStyles.attractiveCard,
                styles.optionCard,
                selectedPlayers === option.count && styles.optionCardSelected,
                !option.available && styles.optionCardDisabled,
              ]}
              onPress={() => {
                if (option.available) {
                  handlePlayerSelection(option.count);
                } else {
                  Alert.alert('Coming Soon', 'This mode will be available soon!');
                }
              }}
              disabled={!option.available}>
              
              <View style={styles.optionHeader}>
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                </View>
                
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                  <View style={styles.optionMeta}>
                    <Text style={styles.optionDifficulty}>🎯 {option.difficulty}</Text>
                    <Text style={styles.optionTime}>⏱️ {option.estimatedTime}</Text>
                  </View>
                </View>
                
                <Text style={styles.selectArrow}>→</Text>
              </View>
              
              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>✨ Features:</Text>
                <View style={styles.featuresList}>
                  {option.features.map((feature, index) => (
                    <Text key={index} style={styles.featureItem}>
                      • {feature}
                    </Text>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Game Rules - Compact */}
        <View style={styles.rulesSection}>
          <Text style={styles.sectionTitle}>📋 Quick Rules</Text>
          <View style={styles.rulesGrid}>
            <View style={styles.ruleCard}>
              <Text style={styles.ruleIcon}>🎯</Text>
              <Text style={styles.ruleText}>Match card pairs by memory</Text>
            </View>
            <View style={styles.ruleCard}>
              <Text style={styles.ruleIcon}>⚡</Text>
              <Text style={styles.ruleText}>Take turns with opponent</Text>
            </View>
            <View style={styles.ruleCard}>
              <Text style={styles.ruleIcon}>🏆</Text>
              <Text style={styles.ruleText}>Most matches wins 80%</Text>
            </View>
            <View style={styles.ruleCard}>
              <Text style={styles.ruleIcon}>💰</Text>
              <Text style={styles.ruleText}>Platform fee: 20%</Text>
            </View>
          </View>
        </View>

        {/* Fair Play Notice */}
        <View style={styles.fairPlaySection}>
          <View style={styles.fairPlayCard}>
            <View style={styles.fairPlayHeader}>
              <Text style={styles.fairPlayIcon}>🛡️</Text>
              <Text style={styles.fairPlayTitle}>Fair Play Guaranteed</Text>
            </View>
            <Text style={styles.fairPlayText}>
              All games monitored by anti-cheat system. Play fair, win fair!
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  modeSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  
  optionCard: {
    marginBottom: theme.spacing.lg,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  optionCardSelected: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.backgroundLight,
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  optionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.primaryShadow,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  optionMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  optionDifficulty: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSuccess,
    fontWeight: '600',
  },
  optionTime: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textInfo,
    fontWeight: '600',
  },
  selectArrow: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  
  featuresSection: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  featuresTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  featureItem: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSuccess,
    fontWeight: '500',
  },
  
  rulesSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  rulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  ruleCard: {
    width: '48%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ruleIcon: {
    fontSize: 20,
    marginBottom: theme.spacing.sm,
  },
  ruleText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  fairPlaySection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  fairPlayCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fairPlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  fairPlayIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  fairPlayTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.textSuccess,
  },
  fairPlayText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default PlayerSelectionScreen;