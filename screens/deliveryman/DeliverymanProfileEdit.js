import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {portLink} from '../../navigation/AppNavigation'

export default function DeliverymanProfileEdit({ navigation }) {
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const tk = await AsyncStorage.getItem('token');
        const id = await AsyncStorage.getItem('userId');
        if (!id || !tk) {
          Alert.alert('Error', 'User not found or not logged in.');
          return;
        }

        setToken(tk);
        setUserId(id);

        const res = await fetch(`${portLink()}/users/by_id/${id}`, {
          headers: { 'Authorization': `Bearer ${tk}` }
        });

        const data = await res.json();
        if (!res.ok) {
          Alert.alert('Error', data.error || 'Failed to fetch profile');
          return;
        }

        setProfile(data);
        setName(data.name || '');
        setContact(data.phone || '');
        setImageUri(data.image || null);
      } catch (error) {
        console.log('Fetch profile error:', error);
        Alert.alert('Error', 'Something went wrong while fetching profile');
      }
    };

    fetchProfile();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll permission is required to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      const updateData = { name, phone: contact, image: imageUri };

      const res = await fetch(`${portLink()}/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Failed to update profile');
        return;
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.navigate('DeliverymanHome');
    } catch (err) {
      console.log('Update profile error:', err);
      Alert.alert('Error', 'Something went wrong while updating profile');
    }
  };

  if (!profile) return <Text style={{ padding: 20 }}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={imageUri ? { uri: imageUri } : require('../../assets/placeholderpp.png')}
          style={styles.image}
        />
        <Text style={{ textAlign: 'center', marginBottom: 20, color: 'blue' }}>Tap to change image</Text>
      </TouchableOpacity>

      <Text>Name:</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Text>Contact:</Text>
      <TextInput
        value={contact}
        onChangeText={setContact}
        style={styles.input}
      />

      <Button title="Save Changes" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  image: { width: 120, height: 120, borderRadius: 60, marginBottom: 10, alignSelf: 'center' },
});
