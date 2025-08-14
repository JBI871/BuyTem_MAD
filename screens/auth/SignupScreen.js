import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, Image, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { portLink } from '../../navigation/AppNavigation';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('buyer'); // default role
  const [image, setImage] = useState('');

  const placeholderImage = require('../../assets/placeholderpp.png'); // your placeholder image

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
      headers: {
        'Content-Type': 'application/json',
      },
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
      // Backend returned error
      Alert.alert('Error', data.error || 'Signup failed');
      return;
    }

    Alert.alert('Success', 'User registered successfully');

    // Optional: navigate back to login
    navigation.goBack();

  } catch (error) {
    console.log('Signup error:', error);
    Alert.alert('Error', 'Something went wrong during signup');
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signup</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={image ? { uri: image } : placeholderImage}
          style={styles.profileImage}
        />
      </TouchableOpacity>

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        keyboardType="phone-pad"
      />

      <Text style={{ marginBottom:5 }}>Select Role:</Text>
      <View style={{ flexDirection:'row', marginBottom:20, justifyContent:'space-around', width:'100%' }}>
        {['buyer','deliveryman'].map(r => (
          <Button
            key={r}
            title={r.charAt(0).toUpperCase() + r.slice(1)}
            onPress={() => setRole(r)}
            color={role === r ? 'blue' : 'gray'}
          />
        ))}
      </View>

      <Button title="Signup" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  title: { fontSize:24, marginBottom:20 },
  input: { width:'100%', borderWidth:1, marginBottom:10, padding:8, borderRadius:5 },
  profileImage: { width:100, height:100, borderRadius:50, marginBottom:10 }
});
