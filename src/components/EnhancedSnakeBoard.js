import React, { useMemo } from 'react';
import { View, Text, Animated } from 'react-native';
import { gameStyles } from '../styles/gameStyles';

const SNAKES = {
  99: 21, 95: 75, 87: 24, 62: 19, 
  54: 34, 49: 11, 46: 25, 17: 7
};

const LADDERS = {
  4: 14, 9: 31, 20: 38, 28: 84, 
  40: 59, 51: 67, 63: 81, 71: 91
};

export default function EnhancedSnakeBoard({ players, currentPlayer, lastMove }) {
  const board = useMemo(() => {
    const generatedBoard = [];
    let number = 100;
    
    for (let row = 0; row < 10; row++) {
      const currentRow = [];
      for (let col = 0; col < 10; col++) {
        currentRow.push(number--);
      }
      if (row % 2 === 1) currentRow.reverse();
      generatedBoard.push(currentRow);
    }
    return generatedBoard;
  }, []);

  const getCellStyle = (cellNumber) => {
    const baseStyle = [gameStyles.cell];
    
    if (SNAKES[cellNumber]) {
      baseStyle.push(gameStyles.snakeCell);
    } else if (LADDERS[cellNumber]) {
      baseStyle.push(gameStyles.ladderCell);
    } else if (cellNumber === 1 || cellNumber === 100) {
      baseStyle.push(gameStyles.specialCell);
    }
    
    return baseStyle;
  };

  const getPlayersAtPosition = (position) => {
    return players.filter(player => player.position === position);
  };

  const renderPlayerTokens = (position) => {
    const playersAtPosition = getPlayersAtPosition(position);
    
    return playersAtPosition.map((player, index) => (
      <Animated.Text
        key={player.id}
        style={[
          gameStyles.playerToken,
          {
            transform: [
              { translateX: (index % 2) * 8 - 4 },
              { translateY: Math.floor(index / 2) * 8 - 4 }
            ]
          }
        ]}
      >
        {player.avatar}
      </Animated.Text>
    ));
  };

  const getSpecialSymbol = (cellNumber) => {
    if (SNAKES[cellNumber]) return '🐍';
    if (LADDERS[cellNumber]) return '🪜';
    if (cellNumber === 1) return '🏁';
    if (cellNumber === 100) return '🏆';
    return null;
  };

  return (
    <View style={gameStyles.boardContainer}>
      <View style={gameStyles.board}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={gameStyles.row}>
            {row.map((cellNumber) => (
              <View key={cellNumber} style={getCellStyle(cellNumber)}>
                <Text style={gameStyles.cellNumber}>{cellNumber}</Text>
                
                {getSpecialSymbol(cellNumber) && (
                  <Text style={{ fontSize: 10, position: 'absolute', top: 2, right: 2 }}>
                    {getSpecialSymbol(cellNumber)}
                  </Text>
                )}
                
                {renderPlayerTokens(cellNumber)}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}