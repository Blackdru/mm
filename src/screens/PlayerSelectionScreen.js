import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';

const PlayerSelectionScreen = ({navigation, route}) => {
  const {game} = route.params;
  const [selectedPlayers, setSelectedPlayers] = useState(null);

  // Generate player options based on game type
  const getPlayerOptions = () => {
    if (game.id === 'memory') {
      return [
        {
          count: 2,
          title: '2 Players Only',
          description: 'Memory card matching duel',
          icon: '🧠',
          available: true,
          features: ['Turn-based gameplay', 'Memory challenge', 'Quick matches']
        }
      ];
    } else if (game.id === 'fast_ludo') {
      return [
        {
          count: 2,
          title: '2 Players',
          description: 'Fast-paced Ludo with 5-minute timer',
          icon: '⚡',
          available: true,
          features: ['5-minute timer', 'Points-based scoring', 'All tokens start outside']
        },
        {
          count: 4,
          title: '4 Players',
          description: 'Fast Ludo battle with 10-minute timer',
          icon: '⚡⚡',
          available: true,
          features: ['10-minute timer', 'Points-based scoring', 'All tokens start outside']
        }
      ];
    } else {
      // Classic Ludo
      return [
        {
          count: 2,
          title: '2 Players',
          description: 'Quick match with one opponent',
          icon: '👥',
          available: true,
          features: ['Faster gameplay', 'Quick matchmaking', 'Higher win chances']
        },
        {
          count: 4,
          title: '4 Players',
          description: 'Full game with three opponents',
          icon: '👥👥',
          available: true,
          features: ['Classic Ludo experience', 'More competitive', 'Bigger prize pools']
        }
      ];
    }
  };

  const playerOptions = getPlayerOptions();

  const handlePlayerSelection = (playerCount) => {
    setSelectedPlayers(playerCount);
    
    // Route to appropriate screen based on game type
    if (game.id === 'memory') {
      // For memory game, go directly to matchmaking
      navigation.navigate('Matchmaking', {
        game,
        playerCount,
        entryFee: 0, // Memory game is free for now
      });
    } else {
      // For Ludo games, go to amount selection
      navigation.navigate('AmountSelection', {
        game,
        playerCount,
      });
    }
  };

  const handleBackPress = () => {
    navigation.navigate('Home');
  };

  return (
    <GradientBackground>
      <CommonHeader
        title={game.name}
        subtitle="Select number of players"
        icon={game.image}
        onBackPress={handleBackPress}
      />
      
      <ScrollView style={commonStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Player Options */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>Choose Game Mode</Text>
          
          {playerOptions.map((option) => (
            <TouchableOpacity
              key={option.count}
              style={[
                commonStyles.card,
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
              
              <View style={commonStyles.row}>
                <View style={styles.optionIcon}>
                  <Text style={styles.optionIconText}>{option.icon}</Text>
                </View>
                
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                  
                  <View style={styles.featureList}>
                    {option.features.map((feature, index) => (
                      <Text key={index} style={styles.featureItem}>• {feature}</Text>
                    ))}
                  </View>
                </View>
                
                <View style={styles.optionArrow}>
                  <Text style={styles.optionArrowText}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Game Rules */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>Game Rules</Text>
          <View style={commonStyles.card}>
            {game.id === 'memory' ? (
              <>
                <Text style={styles.ruleItem}>• Match pairs of cards by flipping them</Text>
                <Text style={styles.ruleItem}>• Take turns with your opponent</Text>
                <Text style={styles.ruleItem}>• Remember card positions to win</Text>
                <Text style={styles.ruleItem}>• Player with most matches wins</Text>
                <Text style={styles.ruleItem}>• Free to play - no entry fee</Text>
              </>
            ) : game.id === 'fast_ludo' ? (
              <>
                <Text style={styles.ruleItem}>• All tokens start outside the home</Text>
                <Text style={styles.ruleItem}>• No need to roll 6 to start</Text>
                <Text style={styles.ruleItem}>• Points for moves, kills, and finishing</Text>
                <Text style={styles.ruleItem}>• Timer: 5 mins (2P) / 10 mins (4P)</Text>
                <Text style={styles.ruleItem}>• Highest score when timer ends wins</Text>
              </>
            ) : (
              <>
                <Text style={styles.ruleItem}>• Roll dice to move your pieces</Text>
                <Text style={styles.ruleItem}>• Get all 4 pieces to the center to win</Text>
                <Text style={styles.ruleItem}>• Roll 6 to get an extra turn</Text>
                <Text style={styles.ruleItem}>• Capture opponents to send them home</Text>
                <Text style={styles.ruleItem}>• Winner takes 90% of the prize pool</Text>
              </>
            )}
          </View>
        </View>

        {/* Fair Play Notice */}
        <View style={styles.section}>
          <View style={[commonStyles.card, styles.fairPlayCard]}>
            <Text style={styles.fairPlayTitle}>🛡️ Fair Play Guaranteed</Text>
            <Text style={styles.fairPlayText}>
              All games are monitored for fair play. Cheating or unfair practices 
              will result in account suspension.
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.sm,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceCard,
    ...theme.shadows.large,
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    ...theme.shadows.small,
  },
  optionIconText: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  featureList: {
    marginTop: theme.spacing.xs,
  },
  featureItem: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.success,
    marginBottom: 2,
    fontWeight: '500',
  },
  optionArrow: {
    marginLeft: theme.spacing.sm,
  },
  optionArrowText: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  ruleItem: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
    fontWeight: '500',
  },
  fairPlayCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  fairPlayTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  fairPlayText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textDark,
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default PlayerSelectionScreen;