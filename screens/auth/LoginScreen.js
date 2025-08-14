import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../../navigation/AppNavigation';

export default function LoginScreen({ setUserRole, setUserEmail, navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      console.log('Backend URL:', portLink());

      const response = await fetch(`${portLink()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Check if login failed
      if (!response.ok) {
        Alert.alert('Error', data.error || 'Login failed');
        return;
      }

      // Verify all required fields exist
      if (!data.token || !data.id || !data.role) {
        Alert.alert('Error', 'Login response incomplete. Please check your backend.');
        console.log('Incomplete login response:', data);
        return;
      }

      console.log('Frontend received:', data); // token, id, role

      // Store values in AsyncStorage
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('userId', data.id);
      await AsyncStorage.setItem('userRole', data.role);

      // Update parent state
      if (setUserRole) setUserRole(data.role);
      if (setUserEmail) setUserEmail(email);

      Alert.alert('Success', `Logged in as ${data.role}`);

      // Optionally navigate to protected screen
      // navigation.replace('Home'); // uncomment and change 'Home' to your screen
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Error', 'Something went wrong during login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title="Login" onPress={handleLogin} />

      <View style={styles.signupRow}>
        <Text>Not a member? </Text>
        <Button title="SignUp" onPress={() => navigation.navigate('Signup')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    padding: 8,
    borderRadius: 5,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
});
