import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer'); // default role

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    try {
      const usersJSON = await AsyncStorage.getItem('users');
      const users = usersJSON ? JSON.parse(usersJSON) : [];

      if (users.find(u => u.email === email)) {
        Alert.alert('Error', 'User already exists');
        return;
      }

      users.push({ email, password, role });
      await AsyncStorage.setItem('users', JSON.stringify(users));

      Alert.alert('Success', 'User registered successfully');
      navigation.goBack();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:20 }}>
      <Text style={{ fontSize:24, marginBottom:20 }}>Signup</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ width:'100%', borderWidth:1, marginBottom:10, padding:8, borderRadius:5 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ width:'100%', borderWidth:1, marginBottom:10, padding:8, borderRadius:5 }}
      />

      <Text style={{ marginBottom:5 }}>Select Role:</Text>
      <View style={{ flexDirection:'row', marginBottom:20 }}>
        {['buyer','shopkeeper','deliveryman'].map(r => (
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
