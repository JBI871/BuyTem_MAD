// BuyerProfile.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, StyleSheet, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../../navigation/AppNavigation';

export default function BuyerProfile({ navigation }) {
  const [profile, setProfile] = useState({
    name: '',
    contact: '',
    email: '',
    imageUri: null,
    addresses: [],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('token');

        if (!userId || !token) {
          Alert.alert('Error', 'User not logged in');
          return;
        }

        // Fetch user profile
        const resProfile = await fetch(`${portLink()}/users/by_id/${userId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const dataProfile = await resProfile.json();
        if (!resProfile.ok) {
          Alert.alert('Error', dataProfile.error || 'Failed to fetch profile');
          return;
        }

        // Fetch addresses
        const resAddresses = await fetch(`${portLink()}/addresses/user/${userId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const dataAddresses = await resAddresses.json();
        if (!resAddresses.ok) {
          Alert.alert('Error', 'Failed to fetch addresses');
        }

        setProfile({
          name: dataProfile.name || '',
          contact: dataProfile.phone || '',
          email: dataProfile.email || '',
          imageUri: dataProfile.image || null,
          addresses: dataAddresses || [],
        });

      } catch (err) {
        console.log('Fetch profile error:', err);
        Alert.alert('Error', 'Something went wrong while fetching profile');
      }
    };

    fetchProfile();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buyer Profile</Text>

      <Image
        source={profile.imageUri ? { uri: profile.imageUri } : require('../../assets/placeholderpp.png')}
        style={styles.image}
      />
      <Text>Name: {profile.name || 'N/A'}</Text>
      <Text>Email: {profile.email || 'N/A'}</Text>
      <Text>Contact: {profile.contact || 'N/A'}</Text>

      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>Delivery Addresses:</Text>
      {profile.addresses.length === 0 ? (
        <Text>No addresses added</Text>
      ) : (
        <FlatList
          data={profile.addresses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.addressBox}>
              <Text>{index + 1}. {item.apartment_no}, {item.building_no}, {item.floor_num}, {item.road}</Text>
            </View>
          )}
        />
      )}

      <Button
        title="Edit Profile"
        onPress={() => navigation.navigate('BuyerProfileEdit', { profile })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  image: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  addressBox: { 
    padding: 8, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 5, 
    marginVertical: 4, 
    width: '100%' 
  },
});
