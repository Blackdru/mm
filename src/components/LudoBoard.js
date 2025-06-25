import React from 'react';
import {View, StyleSheet, Dimensions, Text} from 'react-native';

const {width} = Dimensions.get('window');
const boardSize = Math.min(width - 40, 350);

const LudoBoard = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
  const colorNames = ['Red', 'Green', 'Blue', 'Yellow'];

  const renderHomeArea = (color, colorName, position) => {
    return (
      <View
        key={`home-${colorName}`}
        style={[
          styles.homeArea,
          {backgroundColor: color},
          position
        ]}>
        <Text style={styles.homeText}>{colorName}</Text>
        <View style={styles.piecesContainer}>
          {[1, 2, 3, 4].map(piece => (
            <View
              key={piece}
              style={[styles.piece, {backgroundColor: color}]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderGamePath = () => {
    const pathCells = [];
    for (let i = 0; i < 52; i++) {
      pathCells.push(
        <View
          key={`path-${i}`}
          style={[
            styles.pathCell,
            i % 13 === 1 && styles.safeCell
          ]}
        />
      );
    }
    return pathCells;
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {/* Home areas */}
        {renderHomeArea(colors[0], colorNames[0], styles.topLeft)}
        {renderHomeArea(colors[1], colorNames[1], styles.topRight)}
        {renderHomeArea(colors[2], colorNames[2], styles.bottomRight)}
        {renderHomeArea(colors[3], colorNames[3], styles.bottomLeft)}

        {/* Center area */}
        <View style={styles.centerArea}>
          <Text style={styles.centerText}>LUDO</Text>
        </View>

        {/* Game path representation */}
        <View style={styles.pathContainer}>
          <Text style={styles.pathText}>Game Path</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    width: boardSize,
    height: boardSize,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  homeArea: {
    position: 'absolute',
    width: boardSize * 0.4,
    height: boardSize * 0.4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    opacity: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topLeft: {
    top: 10,
    left: 10,
  },
  topRight: {
    top: 10,
    right: 10,
  },
  bottomLeft: {
    bottom: 10,
    left: 10,
  },
  bottomRight: {
    bottom: 10,
    right: 10,
  },
  homeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  piecesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 60,
  },
  piece: {
    width: 20,
    height: 20,
    borderRadius: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  centerArea: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    width: '20%',
    height: '20%',
    backgroundColor: '#FFD700',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  pathContainer: {
    position: 'absolute',
    top: '45%',
    left: '10%',
    right: '10%',
    alignItems: 'center',
  },
  pathText: {
    fontSize: 12,
    color: '#666',
  },
  pathCell: {
    width: 20,
    height: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
    margin: 1,
  },
  safeCell: {
    backgroundColor: '#FFD700',
  },
});

export default LudoBoard;