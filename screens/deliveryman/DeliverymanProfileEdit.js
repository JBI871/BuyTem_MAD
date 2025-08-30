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
    <LinearGradient colors={['#F3E9DC', '#F8B259']} style={styles.loadingContainer}>
      <Text style={{ color: '#C75D2C', fontSize: 16 }}>Loading...</Text>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#F3E9DC', '#F8B259']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Edit Profile</Text>

          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            <Image
              source={imageUri ? { uri: imageUri } : require('../../assets/placeholderpp.png')}
              style={styles.image}
            />
            <Text style={styles.imageText}>Tap to change image</Text>
          </TouchableOpacity>

          <View style={styles.formSection}>
            <Text style={styles.label}>Name:</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor="#D96F32"
              placeholder="Enter your name"
            />

            <Text style={styles.label}>Contact:</Text>
            <TextInput
              value={contact}
              onChangeText={setContact}
              style={styles.input}
              placeholderTextColor="#D96F32"
              placeholder="Enter your contact number"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity onPress={handleSave} style={styles.buttonWrapper}>
            <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.button}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  container: { 
    flex: 1 
  },
  scroll: { 
    padding: 20 
  },
  card: {
    backgroundColor: 'rgba(215, 111, 50, 0.08)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#C75D2C',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.15)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C75D2C',
    textAlign: 'center',
    marginBottom: 25,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  image: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#D96F32',
    shadowColor: '#C75D2C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  imageText: {
    textAlign: 'center',
    color: '#D96F32',
    marginTop: 10,
    fontSize: 15,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  formSection: {
    backgroundColor: 'rgba(243, 233, 220, 0.4)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.1)',
  },
  label: {
    color: '#D96F32',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(243, 233, 220, 0.6)',
    color: '#C75D2C',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(215, 111, 50, 0.3)',
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#C75D2C',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonWrapper: {
    marginTop: 10,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#C75D2C',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  buttonText: {
    color: '#F3E9DC',
    fontWeight: 'bold',
    fontSize: 17,
  },
});