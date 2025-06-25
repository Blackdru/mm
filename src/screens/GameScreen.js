import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import {useGame} from '../context/GameContext';
import LudoBoard from '../components/LudoBoard';
import PlayerInfo from '../components/PlayerInfo';
import DiceComponent from '../components/DiceComponent';

const {width, height} = Dimensions.get('window');

const GameScreen = ({route}) => {
  const {playerCount, paymentConfirmed} = route.params;
  const {
    gameId,
    players,
    currentTurn,
    gameStatus,
    winner,
    joinGame,
    rollDice,
    diceValue
  } = useGame();

  useEffect(() => {
    if (paymentConfirmed) {
      joinGame(playerCount, paymentConfirmed);
    }
  }, [paymentConfirmed]);

  useEffect(() => {
    if (winner) {
      Alert.alert('Game Over', `Player ${winner} wins!`);
    }
  }, [winner]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.gameTitle}>Ludo Master</Text>
        <Text style={styles.gameId}>Game ID: {gameId}</Text>
      </View>

      <PlayerInfo players={players} currentTurn={currentTurn} />
      
      <View style={styles.gameContainer}>
        <LudoBoard />
      </View>

      <View style={styles.controls}>
        <DiceComponent value={diceValue} onRoll={rollDice} />
        <Text style={styles.turnText}>
          {gameStatus === 'waiting' ? 'Waiting for players...' : 
           gameStatus === 'playing' ? `Player ${currentTurn + 1}'s Turn` :
           'Game Over'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F3460',
  },
  header: {
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  gameId: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.7,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  controls: {
    padding: 20,
    alignItems: 'center',
  },
  turnText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 15,
  },
});

export default GameScreen;