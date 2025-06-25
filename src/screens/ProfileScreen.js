import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  
  // Check if this is a new user (no name set)
  const isNewUser = !user?.name || user.name.trim() === '';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    const result = await updateProfile({ name: name.trim(), email: email.trim() });
    setLoading(false);
    
    if (result.success) {
      if (isNewUser) {
        Alert.alert('Welcome!', 'Profile setup complete!', [
          { text: 'Continue', onPress: () => navigation.navigate('Home') }
        ]);
      } else {
        Alert.alert('Success', 'Profile updated!');
        navigation.goBack();
      }
    } else {
      Alert.alert('Error', result.message || 'Failed to update profile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            {!isNewUser && (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.title}>
              {isNewUser ? 'Complete Your Profile' : 'Profile'}
            </Text>
            {!isNewUser && <View style={{ width: 60 }} />}
          </View>
          
          {isNewUser && (
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome to Budzee! 🎮</Text>
              <Text style={styles.welcomeSubtext}>
                Please complete your profile to get started
              </Text>
            </View>
          )}
          
          <View style={styles.form}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.value}>{user?.phoneNumber}</Text>
            
            <Text style={[styles.label, styles.required]}>Name *</Text>
            <TextInput
              style={[styles.input, !name.trim() && styles.inputError]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              returnKeyType="next"
            />
            
            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
            
            <TouchableOpacity 
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
              onPress={handleSave} 
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>
                {loading ? 'Saving...' : isNewUser ? 'Complete Setup' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backText: { fontSize: 16, color: '#3498db', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', flex: 1 },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: { fontSize: 14, color: '#7f8c8d', marginBottom: 4, marginTop: 12 },
  required: { color: '#e74c3c' },
  value: { fontSize: 16, color: '#2c3e50', marginBottom: 8, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  saveBtn: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnDisabled: {
    backgroundColor: '#bdc3c7',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
