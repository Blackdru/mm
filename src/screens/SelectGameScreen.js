import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const games = [
  { key: 'LUDO', name: 'Ludo' },
  // Add more games here in the future
];

const SelectGameScreen = ({ navigation }) => {
  const handleSelect = (gameType, playerCount) => {
    navigation.navigate('SelectAmountScreen', { gameType, playerCount });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Game</Text>
      {games.map(game => (
        <View key={game.key} style={styles.gameBlock}>
          <Text style={styles.gameName}>{game.name}</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.optionBtn} onPress={() => handleSelect(game.key, 2)}>
              <Text style={styles.optionText}>2 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => handleSelect(game.key, 4)}>
              <Text style={styles.optionText}>4 Players</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f6fa',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  gameBlock: {
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionBtn: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SelectGameScreen;
