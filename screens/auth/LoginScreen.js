import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../../navigation/AppNavigation';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ setUserRole, setUserEmail, navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      const response = await fetch(`${portLink()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Login failed');
        return;
      }

      if (!data.token || !data.id || !data.role) {
        Alert.alert('Error', 'Login response incomplete. Please check your backend.');
        return;
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('userId', data.id);
      await AsyncStorage.setItem('userRole', data.role);

      if (setUserRole) setUserRole(data.role);
      if (setUserEmail) setUserEmail(email);

      Alert.alert('Success', `Logged in as ${data.role}`);
      // navigation.replace('Home');
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Error', 'Something went wrong during login');
    }
  };

  return (
    <LinearGradient
      colors={['#1E1E2E', '#121212']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back 👋</Text>
          <Text style={styles.subtitle}>Login to continue</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity onPress={handleLogin} style={styles.buttonWrapper}>
            <LinearGradient
              colors={['#6C63FF', '#514BC3']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Not a member? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#bbb',
    marginBottom: 20,
    marginTop: 5,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#2A2A3C',
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#fff',
  },
  buttonWrapper: {
    marginTop: 5,
    marginBottom: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  signupText: {
    color: '#bbb',
  },
  signupLink: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
});
