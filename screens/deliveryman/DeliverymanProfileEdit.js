import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

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

  if (!profile) return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.loadingContainer}>
      <Text style={{ color: '#fff', fontSize: 16 }}>Loading...</Text>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Edit Profile</Text>

          <TouchableOpacity onPress={pickImage}>
            <Image
              source={imageUri ? { uri: imageUri } : require('../../assets/placeholderpp.png')}
              style={styles.image}
            />
            <Text style={styles.imageText}>Tap to change image</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Name:</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Contact:</Text>
          <TextInput
            value={contact}
            onChangeText={setContact}
            style={styles.input}
            placeholderTextColor="#888"
          />

          <TouchableOpacity onPress={handleSave} style={styles.buttonWrapper}>
            <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  scroll: { padding: 20 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#6C63FF',
    marginBottom: 10,
    alignSelf: 'center',
  },
  imageText: {
    textAlign: 'center',
    color: '#6C63FF',
    marginBottom: 20,
    fontSize: 14,
  },
  label: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonWrapper: {
    marginTop: 20,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
