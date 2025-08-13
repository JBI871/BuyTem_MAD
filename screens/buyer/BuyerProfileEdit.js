import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function BuyerProfileEdit({ route, navigation }) {
  const { profile } = route.params;

  const [name, setName] = useState(profile.name || '');
  const [contact, setContact] = useState(profile.contact || '');
  const [imageUri, setImageUri] = useState(profile.imageUri || null);
  const [addresses, setAddresses] = useState(profile.addresses || []);
  const [newAddress, setNewAddress] = useState('');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission denied', 'You need to allow access to media library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!result.cancelled) {
      setImageUri(result.uri);
    }
  };

  const addAddress = () => {
    if (newAddress.trim() !== '') {
      setAddresses([...addresses, newAddress.trim()]);
      setNewAddress('');
    }
  };

  const removeAddress = (index) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const saveProfile = async () => {
    try {
      const usersJSON = await AsyncStorage.getItem('users');
      const users = usersJSON ? JSON.parse(usersJSON) : [];
      const updatedUsers = users.map(u => {
        if (u.email === profile.email) {
          return { ...u, name, contact, imageUri, addresses };
        }
        return u;
      });
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      Alert.alert('Success', 'Profile updated!');
      navigation.goBack();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={imageUri ? { uri: imageUri } : require('../../assets/placeholderpp.png')}
          style={styles.image}
        />
        <Text style={{ color: 'blue', marginTop:5 }}>Change Image</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Contact"
        value={contact}
        onChangeText={setContact}
        style={styles.input}
      />

      <Text style={{ fontWeight:'bold', marginTop: 10 }}>Addresses</Text>
      <FlatList
        data={addresses}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.addressRow}>
            <Text>{item}</Text>
            <Button title="Remove" color="red" onPress={() => removeAddress(index)} />
          </View>
        )}
      />

      <TextInput
        placeholder="Add new address"
        value={newAddress}
        onChangeText={setNewAddress}
        style={styles.input}
      />
      <Button title="Add Address" onPress={addAddress} />

      <View style={{ marginTop:20 }}>
        <Button title="Save Profile" onPress={saveProfile} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20 },
  title: { fontSize:24, fontWeight:'bold', marginBottom:20, textAlign:'center' },
  input: { borderWidth:1, borderRadius:5, padding:8, marginVertical:5 },
  image: { width:100, height:100, borderRadius:50, alignSelf:'center', marginBottom:10 },
  addressRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:5 }
});
