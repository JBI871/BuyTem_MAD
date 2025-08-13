import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ setUserRole, navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const usersJSON = await AsyncStorage.getItem('users');
      const users = usersJSON ? JSON.parse(usersJSON) : [];

      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        setUserRole(user.role);
        Alert.alert('Success', `Logged in as ${user.role}`);
      } else {
        Alert.alert('Error', 'Invalid email or password');
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:20 }}>
      <Text style={{ fontSize:24, marginBottom:20 }}>Login</Text>

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
        style={{ width:'100%', borderWidth:1, marginBottom:20, padding:8, borderRadius:5 }}
      />

      <Button title="Login" onPress={handleLogin} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <Text>Not a member? </Text>
        <Button title="SignUp" onPress={() => navigation.navigate('Signup')} />
      </View>
    </View>
  );
}
