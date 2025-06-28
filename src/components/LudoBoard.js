import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import DiceComponent from './DiceComponent';

const { width, height } = Dimensions.get('window');
const boardSize = Math.min(width - 20, height - 200, 400);
const cellSize = boardSize / 15; // 15x15 grid

const LudoBoard = ({ 
  gameState, 
  currentPlayer, 
  diceValue, 
  onPieceMove, 
  players = [], 
  playerId, 
  canMove = false 
}) => {
  const [localCurrentPlayer, setLocalCurrentPlayer] = useState(0);
  const [localDiceValue, setLocalDiceValue] = useState(1);
  
  // Use props if provided, otherwise use local state for standalone mode
  const activePlayer = currentPlayer !== undefined ? currentPlayer : localCurrentPlayer;
  const activeDiceValue = diceValue !== undefined ? diceValue : localDiceValue;
  
  // Ensure activePlayer is a valid number for array access
  const safeActivePlayer = typeof activePlayer === 'number' ? Math.abs(activePlayer) : 0;
  const playerColorIndex = safeActivePlayer % 4;

  const colors = [
    { primary: '#FF4757', secondary: '#FF3742', light: '#FFE8EA', name: 'Red' },
    { primary: '#2ED573', secondary: '#20BF6B', light: '#E8F5E8', name: 'Green' },
    { primary: '#3742FA', secondary: '#2F3542', light: '#E8EAFF', name: 'Blue' },
    { primary: '#FFA502', secondary: '#FF9500', light: '#FFF4E6', name: 'Yellow' }
  ];

  const handleDiceRoll = () => {
    // If onPieceMove is provided, this is a multiplayer game - don't handle dice locally
    if (onPieceMove) {
      return;
    }
    
    // Local standalone mode
    const newValue = Math.floor(Math.random() * 6) + 1;
    setLocalDiceValue(newValue);
    
    // Switch player if not 6
    if (newValue !== 6) {
      setLocalCurrentPlayer((prev) => (prev + 1) % 4);
    }
  };

  // Generate path coordinates for tokens to move
  const generatePath = () => {
    const path = [];
    const center = 7; // Center of 15x15 grid
    
    // Starting positions for each color (safe squares)
    const startPositions = [
      { row: 6, col: 1 },  // Red start
      { row: 1, col: 8 },  // Green start  
      { row: 8, col: 13 }, // Blue start
      { row: 13, col: 6 }  // Yellow start
    ];

    // Create the outer path (52 squares)
    // Top row (left to right)
    for (let col = 1; col <= 6; col++) {
      path.push({ row: 6, col, safe: col === 2 });
    }
    
    // Right column (top to bottom)
    for (let row = 1; row <= 6; row++) {
      path.push({ row, col: 8, safe: row === 2 });
    }
    
    // Top-right to bottom-right
    for (let row = 7; row <= 8; row++) {
      path.push({ row, col: 8 });
    }
    
    // Right side continuing down
    for (let row = 9; row <= 13; row++) {
      path.push({ row, col: 8, safe: row === 12 });
    }
    
    // Bottom row (right to left)
    for (let col = 9; col <= 13; col++) {
      path.push({ row: 8, col, safe: col === 12 });
    }
    
    // Bottom row continuing
    for (let col = 7; col >= 1; col--) {
      path.push({ row: 8, col, safe: col === 2 });
    }
    
    // Left column (bottom to top)
    for (let row = 9; row <= 13; row++) {
      path.push({ row, col: 6, safe: row === 12 });
    }
    
    // Left side continuing up
    for (let row = 7; row >= 1; row--) {
      path.push({ row, col: 6, safe: row === 2 });
    }

    return path;
  };

  const path = generatePath();

  const renderHomeArea = (colorObj, position, playerIndex) => {
    if (!colorObj || typeof playerIndex !== 'number') {
      return null;
    }
    
    const homePositions = [
      { top: cellSize, left: cellSize }, // Red - top-left
      { top: cellSize, right: cellSize }, // Green - top-right  
      { bottom: cellSize, right: cellSize }, // Blue - bottom-right
      { bottom: cellSize, left: cellSize }  // Yellow - bottom-left
    ];

    const safePlayerIndex = Math.max(0, Math.min(3, playerIndex));
    const homePosition = homePositions[safePlayerIndex] || homePositions[0];

    return (
      <View
        key={`home-${colorObj.name || playerIndex}`}
        style={[
          styles.homeArea,
          {
            backgroundColor: colorObj.primary || '#FF4757',
            ...homePosition,
            width: cellSize * 6,
            height: cellSize * 6,
          }
        ]}
      >
        {/* Home area border */}
        <View style={[styles.homeAreaInner, { backgroundColor: colorObj.light || '#FFE8EA' }]}>
          <Text style={[styles.homeText, { color: colorObj.primary || '#FF4757' }]}>
            {colorObj.name || 'Player'}
          </Text>
          
          {/* Game pieces */}
          <View style={styles.piecesGrid}>
            {[1, 2, 3, 4].map(piece => (
              <TouchableOpacity
                key={piece}
                style={[
                  styles.gamePiece,
                  {
                    backgroundColor: colorObj.primary || '#FF4757',
                    borderColor: colorObj.secondary || '#FF3742',
                  }
                ]}
              >
                <View style={[styles.pieceInner, { backgroundColor: colorObj.light || '#FFE8EA' }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderPathCell = (row, col) => {
    const isPath = path.some(p => p.row === row && p.col === col);
    const pathCell = path.find(p => p.row === row && p.col === col);
    const isSafe = pathCell?.safe;
    const isCenter = row === 7 && col === 7;
    const isFinishLine = (
      (row === 7 && col >= 2 && col <= 6) || // Red finish line
      (col === 8 && row >= 2 && row <= 6) || // Green finish line  
      (row === 7 && col >= 9 && col <= 12) || // Blue finish line
      (col === 6 && row >= 9 && row <= 12)   // Yellow finish line
    );

    let backgroundColor = '#F8F9FA';
    let borderColor = '#E9ECEF';

    if (isCenter) {
      backgroundColor = '#FFD700';
      borderColor = '#FFA500';
    } else if (isFinishLine) {
      // Color finish lines according to player
      if (row === 7 && col >= 2 && col <= 6) backgroundColor = colors[0]?.light || '#FFE8EA'; // Red
      else if (col === 8 && row >= 2 && row <= 6) backgroundColor = colors[1]?.light || '#E8F5E8'; // Green
      else if (row === 7 && col >= 9 && col <= 12) backgroundColor = colors[2]?.light || '#E8EAFF'; // Blue
      else if (col === 6 && row >= 9 && row <= 12) backgroundColor = colors[3]?.light || '#FFF4E6'; // Yellow
      borderColor = '#CED4DA';
    } else if (isSafe) {
      backgroundColor = '#FFF3CD';
      borderColor = '#FFEAA7';
    } else if (isPath) {
      backgroundColor = '#FFFFFF';
      borderColor = '#DEE2E6';
    }

    return (
      <View
        key={`cell-${row}-${col}`}
        style={[
          styles.pathCell,
          {
            backgroundColor,
            borderColor,
            width: cellSize,
            height: cellSize,
          }
        ]}
      >
        {isSafe && (
          <Text style={styles.safeMarker}>★</Text>
        )}
        {isCenter && (
          <Text style={styles.centerIcon}>🏠</Text>
        )}
      </View>
    );
  };

  const renderBoard = () => {
    const board = [];
    
    // Create 15x15 grid
    for (let row = 0; row < 15; row++) {
      const rowCells = [];
      for (let col = 0; col < 15; col++) {
        rowCells.push(renderPathCell(row, col));
      }
      board.push(
        <View key={`row-${row}`} style={styles.boardRow}>
          {rowCells}
        </View>
      );
    }
    
    return board;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Game Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎲 LUDO ROYALE 🎲</Text>
        <Text style={styles.subtitle}>Professional Edition</Text>
      </View>

      {/* Current Player Indicator */}
      <View style={styles.playerIndicator}>
        <Text style={styles.playerText}>Current Player:</Text>
        <View style={[
          styles.playerChip,
          { backgroundColor: colors[playerColorIndex]?.primary || '#FF4757' }
        ]}>
          <Text style={styles.playerChipText}>
            {players.length > 0 ? 
              (() => {
                // Find current player by ID if activePlayer is an ID, otherwise use index
                const currentPlayerData = typeof activePlayer === 'string' ? 
                  players.find(p => p.id === activePlayer) : 
                  players[safeActivePlayer % players.length];
                
                return currentPlayerData?.name || currentPlayerData?.playerName || colors[playerColorIndex]?.name || 'Player';
              })() :
              colors[playerColorIndex]?.name || 'Player'
            }
          </Text>
        </View>
      </View>

      {/* Game Board Container */}
      <View style={styles.boardContainer}>
        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
          {/* Render the grid */}
          {renderBoard()}
          
          {/* Home areas overlay */}
          {colors.map((color, index) => renderHomeArea(color, null, index))}
        </View>
      </View>

      {/* Dice Section */}
      <View style={styles.diceSection}>
        <DiceComponent 
          value={activeDiceValue} 
          onRoll={handleDiceRoll} 
          disabled={onPieceMove && !canMove}
        />
      </View>

      {/* Game Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to Play:</Text>
        <Text style={styles.instructionText}>
          • Roll 6 to move pieces out of home{'\n'}
          • Land on ★ safe squares to protect pieces{'\n'}
          • Get all 4 pieces to center 🏠 to win!{'\n'}
          • Roll 6 to get another turn
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8E8E8',
    marginTop: 5,
  },
  playerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  playerText: {
    color: '#E8E8E8',
    fontSize: 16,
    marginRight: 10,
  },
  playerChip: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  playerChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  boardContainer: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginBottom: 20,
  },
  board: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  boardRow: {
    flexDirection: 'row',
  },
  pathCell: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeMarker: {
    fontSize: cellSize * 0.4,
    color: '#FF6B35',
  },
  centerIcon: {
    fontSize: cellSize * 0.5,
  },
  homeArea: {
    position: 'absolute',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  homeAreaInner: {
    flex: 1,
    margin: 8,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  homeText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  piecesGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  gamePiece: {
    width: cellSize * 0.8,
    height: cellSize * 0.8,
    borderRadius: cellSize * 0.4,
    borderWidth: 2,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pieceInner: {
    width: cellSize * 0.4,
    height: cellSize * 0.4,
    borderRadius: cellSize * 0.2,
  },
  diceSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  instructions: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: 350,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#E8E8E8',
    lineHeight: 22,
  },
});

export default LudoBoard;