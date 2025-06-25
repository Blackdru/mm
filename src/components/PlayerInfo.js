import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const PlayerInfo = ({players, currentTurn}) => {
  const playerColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  // Handle both array and object formats for players
  const playersArray = Array.isArray(players) ? players : Object.values(players || {});

  return (
    <View style={styles.container}>
      {playersArray.map((player, index) => (
        <View
          key={player.id || index}
          style={[
            styles.playerCard,
            {backgroundColor: playerColors[index]},
            currentTurn === index && styles.activePlayer
          ]}>
          <Text style={styles.playerName}>{player.name || `Player ${index + 1}`}</Text>
          <Text style={styles.playerScore}>Score: {player.score || 0}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  playerCard: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  activePlayer: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  playerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  playerScore: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
  },
});

export default PlayerInfo;