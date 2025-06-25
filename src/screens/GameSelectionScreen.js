import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

const GameSelectionScreen = ({navigation}) => {
  const games = [
    {
      id: 'ludo',
      name: 'Ludo',
      description: 'Classic board game for 2-4 players',
      image: '🎲',
      minPlayers: 2,
      maxPlayers: 4,
      available: true,
    },
    {
      id: 'snake_ladder',
      name: 'Snake & Ladder',
      description: 'Coming Soon',
      image: '🐍',
      available: false,
    },
    {
      id: 'carrom',
      name: 'Carrom',
      description: 'Coming Soon',
      image: '🎯',
      available: false,
    },
    {
      id: 'chess',
      name: 'Chess',
      description: 'Coming Soon',
      image: '♟️',
      available: false,
    },
  ];

  const handleGameSelect = (game) => {
    if (game.available) {
      navigation.navigate('PlayerSelection', {game});
    } else {
      Alert.alert('Coming Soon', `${game.name} will be available soon!`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Game</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Choose your favorite game to play</Text>
        
        <View style={styles.gamesGrid}>
          {games.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[
                styles.gameCard,
                !game.available && styles.gameCardDisabled,
              ]}
              onPress={() => handleGameSelect(game)}
              disabled={!game.available}>
              <View style={styles.gameImageContainer}>
                <Text style={styles.gameImage}>{game.image}</Text>
              </View>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
              {game.available && (
                <View style={styles.playersInfo}>
                  <Text style={styles.playersText}>
                    {game.minPlayers}-{game.maxPlayers} Players
                  </Text>
                </View>
              )}
              {!game.available && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gameCardDisabled: {
    opacity: 0.6,
  },
  gameImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameImage: {
    fontSize: 40,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 12,
  },
  playersInfo: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playersText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  comingSoonBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default GameSelectionScreen;