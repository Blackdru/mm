// ================= LOBBY SCREEN =================

// 📁 screens/LobbyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { socket, socketManager } from '../config/socket';

export default function LobbyScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Connection status management
    socketManager.onConnect(() => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socketManager.onDisconnect(() => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketManager.onError((error) => {
      console.error('Socket error:', error);
      Alert.alert('Connection Error', 'Failed to connect to game server');
    });

    // Game event handlers
    socket.on('roomCreated', ({ roomId: newRoomId, players }) => {
      setIsLoading(false);
      navigation.navigate('Game', { 
        roomId: newRoomId, 
        username: username.trim(),
        players 
      });
    });

    socket.on('error', ({ message }) => {
      setIsLoading(false);
      Alert.alert('Error', message);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('error');
    };
  }, [navigation, username]);

  const validateInput = (usernameInput, roomIdInput = null) => {
    if (!usernameInput.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return false;
    }

    if (usernameInput.trim().length > 20) {
      Alert.alert('Error', 'Username must be 20 characters or less');
      return false;
    }

    if (roomIdInput !== null && !roomIdInput.trim()) {
      Alert.alert('Error', 'Please enter a room ID');
      return false;
    }

    return true;
  };

  const handleCreateRoom = () => {
    if (!validateInput(username)) return;
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to server. Please wait...');
      return;
    }

    setIsLoading(true);
    socket.emit('createRoom', { username: username.trim() });
  };

  const handleJoinRoom = () => {
    if (!validateInput(username, roomId)) return;
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to server. Please wait...');
      return;
    }

    setIsLoading(true);
    navigation.navigate('Game', { 
      roomId: roomId.trim().toUpperCase(), 
      username: username.trim() 
    });
    setIsLoading(false);
  };

  const connectionStatus = isConnected ? 'Connected' : 'Connecting...';
  const connectionColor = isConnected ? '#27ae60' : '#f39c12';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🐍 Snakes & Ladders 🪜</Text>
          <Text style={styles.subtitle}>Multiplayer Board Game</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: connectionColor }]} />
            <Text style={[styles.statusText, { color: connectionColor }]}>
              {connectionStatus}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username (max 20 chars)"
              placeholderTextColor="#bdc3c7"
              maxLength={20}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleCreateRoom}
              disabled={!isConnected || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>🎮 Create New Game</Text>
                  <Text style={styles.buttonSubtext}>Start a new room</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.joinContainer}>
              <Text style={styles.label}>Room ID</Text>
              <TextInput
                style={styles.input}
                value={roomId}
                onChangeText={(text) => setRoomId(text.toUpperCase())}
                placeholder="Enter room ID (e.g. ROOM_ABC123)"
                placeholderTextColor="#bdc3c7"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleJoinRoom}
                disabled={!isConnected || isLoading}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  🚪 Join Existing Game
                </Text>
                <Text style={[styles.buttonSubtext, styles.secondaryButtonText]}>
                  Enter a friend's room
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🎯 Up to 4 players can join each game
          </Text>
          <Text style={styles.footerText}>
            🏆 First to reach 100 wins!
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  
  keyboardContainer: {
    flex: 1,
  },

  header: {
    backgroundColor: '#2c3e50',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 20,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: 'center',
  },

  inputContainer: {
    marginBottom: 30,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  buttonContainer: {
    alignItems: 'center',
  },

  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  primaryButton: {
    backgroundColor: '#3498db',
    marginBottom: 20,
  },

  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3498db',
  },

  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },

  buttonSubtext: {
    fontSize: 14,
    color: '#ecf0f1',
  },

  secondaryButtonText: {
    color: '#3498db',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#7f8c8d',
  },

  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#bdc3c7',
    fontWeight: '600',
  },

  joinContainer: {
    width: '100%',
  },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },

  footerText: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 8,
  },
});