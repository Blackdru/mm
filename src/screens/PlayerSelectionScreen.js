import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

const PlayerSelectionScreen = ({navigation, route}) => {
  const {game} = route.params;
  const [selectedPlayers, setSelectedPlayers] = useState(null);

  const playerOptions = [
    {
      count: 2,
      title: '2 Players',
      description: 'Quick match with one opponent',
      icon: '👥',
      available: true,
    },
    {
      count: 4,
      title: '4 Players',
      description: 'Full game with three opponents',
      icon: '👥👥',
      available: true,
    },
  ];

  const handlePlayerSelection = (playerCount) => {
    setSelectedPlayers(playerCount);
    navigation.navigate('AmountSelection', {
      game,
      playerCount,
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.gameInfo}>
          <Text style={styles.gameIcon}>{game.image}</Text>
          <Text style={styles.gameTitle}>{game.name}</Text>
          <Text style={styles.gameSubtitle}>Select number of players</Text>
        </View>
      </View>

      {/* Player Options */}
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Choose Game Mode</Text>
        
        {playerOptions.map((option) => (
          <TouchableOpacity
            key={option.count}
            style={[
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
            
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>{option.icon}</Text>
            </View>
            
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
              
              {option.count === 2 && (
                <View style={styles.featureList}>
                  <Text style={styles.featureItem}>• Faster gameplay</Text>
                  <Text style={styles.featureItem}>• Quick matchmaking</Text>
                  <Text style={styles.featureItem}>• Higher win chances</Text>
                </View>
              )}
              
              {option.count === 4 && (
                <View style={styles.featureList}>
                  <Text style={styles.featureItem}>• Classic Ludo experience</Text>
                  <Text style={styles.featureItem}>• More competitive</Text>
                  <Text style={styles.featureItem}>• Bigger prize pools</Text>
                </View>
              )}
            </View>
            
            <View style={styles.optionArrow}>
              <Text style={styles.optionArrowText}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Game Rules */}
      <View style={styles.rulesContainer}>
        <Text style={styles.rulesTitle}>Game Rules</Text>
        <View style={styles.rulesCard}>
          <Text style={styles.ruleItem}>• Roll dice to move your pieces</Text>
          <Text style={styles.ruleItem}>• Get all 4 pieces to the center to win</Text>
          <Text style={styles.ruleItem}>• Roll 6 to get an extra turn</Text>
          <Text style={styles.ruleItem}>• Capture opponents to send them home</Text>
          <Text style={styles.ruleItem}>• Winner takes 90% of the prize pool</Text>
        </View>
      </View>

      {/* Fair Play Notice */}
      <View style={styles.fairPlayContainer}>
        <Text style={styles.fairPlayTitle}>🛡️ Fair Play Guaranteed</Text>
        <Text style={styles.fairPlayText}>
          All games are monitored for fair play. Cheating or unfair practices 
          will result in account suspension.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  gameInfo: {
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  gameSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  optionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconText: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  featureList: {
    marginTop: 4,
  },
  featureItem: {
    fontSize: 12,
    color: '#27ae60',
    marginBottom: 2,
  },
  optionArrow: {
    marginLeft: 16,
  },
  optionArrowText: {
    fontSize: 20,
    color: '#bdc3c7',
  },
  rulesContainer: {
    padding: 20,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  rulesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ruleItem: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
  fairPlayContainer: {
    margin: 20,
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  fairPlayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
  },
  fairPlayText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
});

export default PlayerSelectionScreen;