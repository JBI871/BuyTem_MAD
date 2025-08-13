import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function DeliverymanProfileEdit({ userEmail, navigation }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const usersJSON = await AsyncStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : [];
        const user = users.find(u => u.email === userEmail && u.role === 'deliveryman');

        if (user) {
          setProfile(user);
          setName(user.name ?? '');
          setContact(user.contact ?? '');
          setImageUri(user.imageUri ?? null);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchProfile();
  }, [userEmail]);

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
      const usersJSON = await AsyncStorage.getItem('users');
      const users = usersJSON ? JSON.parse(usersJSON) : [];

      const updatedUsers = users.map(u => {
        if (u.email === userEmail && u.role === 'deliveryman') {
          return { ...u, name, contact, imageUri };
        }
        return u;
      });

      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      Alert.alert('Success', 'Profile updated!');
      navigation.goBack();
    } catch (error) {
      console.log(error);
    }
  };

  if (!profile) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={imageUri ? { uri: imageUri } : require('../../assets/placeholderpp.png')}
          style={styles.image}
        />
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>Tap to change image</Text>
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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  image: { width: 120, height: 120, borderRadius: 60, marginBottom: 10, alignSelf: 'center' },
});
