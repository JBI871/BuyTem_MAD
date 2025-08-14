import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('buyer'); // default role
  const [image, setImage] = useState('');

  const placeholderImage = require('../../assets/placeholderpp.png');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required to access gallery');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSignup = async () => {
    if (!email || !password || !name || !phone) {
      Alert.alert('Error', 'All fields except image are required');
      return;
    }

    try {
      const response = await fetch(`${portLink()}/users/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role: role || 'customer',
          image: image ? image : '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Signup failed');
        return;
      }

      Alert.alert('Success', 'User registered successfully');
      navigation.goBack();
    } catch (error) {
      console.log('Signup error:', error);
      Alert.alert('Error', 'Something went wrong during signup');
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to get started</Text>

          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            <Image
              source={image ? { uri: image } : placeholderImage}
              style={styles.profileImage}
            />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Name"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            placeholder="Phone"
            placeholderTextColor="#aaa"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Text style={styles.roleLabel}>Select Role:</Text>
          <View style={styles.roleRow}>
            {['customer', 'deliveryman'].map(r => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleButton,
                  role === r && styles.roleButtonActive
                ]}
                onPress={() => setRole(r)}
              >
                <Text style={[
                  styles.roleText,
                  role === r && styles.roleTextActive
                ]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleSignup} style={styles.buttonWrapper}>
            <LinearGradient
              colors={['#6C63FF', '#514BC3']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Login</Text>
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
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  changePhotoText: {
    color: '#6C63FF',
    fontSize: 12,
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
  roleLabel: {
    color: '#fff',
    marginBottom: 8,
    marginTop: 5,
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: '#555',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#2A2A3C',
  },
  roleButtonActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  roleText: {
    color: '#aaa',
    fontSize: 14,
  },
  roleTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  loginText: {
    color: '#bbb',
  },
  loginLink: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
});
