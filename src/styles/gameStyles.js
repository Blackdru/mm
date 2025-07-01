import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const boardSize = Math.min(width * 0.95, height * 0.6);

export const gameStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  header: {
    backgroundColor: '#2c3e50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  roomId: {
    color: '#bdc3c7',
    fontSize: 14,
    fontWeight: '600',
  },
  
  gameArea: {
    flex: 1,
    padding: 10,
  },
  
  boardContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  board: {
    width: boardSize,
    height: boardSize,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#fff',
  },
  
  specialCell: {
    backgroundColor: '#f0f8ff',
  },
  
  snakeCell: {
    backgroundColor: '#ffe6e6',
  },
  
  ladderCell: {
    backgroundColor: '#e6ffe6',
  },
  
  cellNumber: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 8,
    color: '#666',
    fontWeight: '500',
  },
  
  playerToken: {
    fontSize: 16,
    position: 'absolute',
    zIndex: 10,
  },
  
  controlsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  diceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  diceButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  diceButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  
  diceButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  diceResult: {
    marginTop: 15,
    alignItems: 'center',
  },
  
  diceValue: {
    fontSize: 48,
    marginBottom: 5,
  },
  
  diceText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  
  playerCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  
  activePlayer: {
    borderWidth: 3,
    borderColor: '#f39c12',
    backgroundColor: '#fef9e7',
    shadowColor: '#f39c12',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  
  myPlayerCard: {
    borderWidth: 2,
    borderColor: '#3498db',
    backgroundColor: '#e8f4fd',
  },
  
  myPlayerName: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  
  currentTurnIndicator: {
    fontSize: 10,
    color: '#f39c12',
    marginTop: 2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  playerAvatar: {
    fontSize: 24,
    marginBottom: 5,
  },
  
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  
  playerPosition: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
  },
  
  messageContainer: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  
  messageText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  winnerContainer: {
    backgroundColor: '#d5f4e6',
    borderColor: '#27ae60',
    borderWidth: 2,
  },
  
  winnerText: {
    color: '#27ae60',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  
  buttonSecondary: {
    backgroundColor: '#95a5a6',
  },
  
  buttonDanger: {
    backgroundColor: '#e74c3c',
  },
  
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  
  emoteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  
  emoteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  
  emoteText: {
    fontSize: 20,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  
  errorContainer: {
    backgroundColor: '#fee',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 10,
    borderColor: '#e74c3c',
    borderWidth: 1,
  },
  
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});