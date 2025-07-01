import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { gameStyles } from '../styles/gameStyles';

export default function PlayersList({ players, currentPlayer, gameStarted, myId }) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={gameStyles.playersContainer}
    >
      {players.map((player) => {
        const isCurrentPlayer = gameStarted && currentPlayer?.id === player.id;
        const isMe = player.id === myId;
        
        return (
          <View
            key={player.id}
            style={[
              gameStyles.playerCard,
              isCurrentPlayer && gameStyles.activePlayer,
              isMe && gameStyles.myPlayerCard
            ]}
          >
            <Text style={gameStyles.playerAvatar}>{player.avatar}</Text>
            <Text style={[
              gameStyles.playerName,
              isMe && gameStyles.myPlayerName
            ]} numberOfLines={1}>
              {isMe ? 'You' : player.username}
            </Text>
            <Text style={gameStyles.playerPosition}>
              Position: {player.position}
            </Text>
            {isCurrentPlayer && (
              <Text style={gameStyles.currentTurnIndicator}>
                🎯 YOUR TURN!
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}