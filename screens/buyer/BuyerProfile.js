import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

        const resProfile = await fetch(`${portLink()}/users/by_id/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const dataProfile = await resProfile.json();
        
        if (!resProfile.ok) {
          Alert.alert('Error', dataProfile.error || 'Failed to fetch profile');
          return;
        }

        const resAddresses = await fetch(`${portLink()}/addresses/user/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const dataAddresses = await resAddresses.json();
        

        setProfile({
          name: dataProfile.name || '',
          contact: dataProfile.phone || '',
          email: dataProfile.email || '',
          imageUri: dataProfile.image || null,
          addresses: dataAddresses || [],
        });
        if(resAddresses.status === 404) {
          return;
        }
        if (!resAddresses.ok) {
          Alert.alert('Error', 'Failed to fetch addresses');
        }
      } catch (err) {
        console.log('Fetch profile error:', err);
        Alert.alert('Error', 'Something went wrong while fetching profile');
      }
    };

    fetchProfile();
  }, []);

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Buyer Profile</Text>

        <Image
          source={profile.imageUri ? { uri: profile.imageUri } : require('../../assets/placeholderpp.png')}
          style={styles.image}
        />

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>{profile.name || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>{profile.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>{profile.contact || 'N/A'}</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Delivery Addresses:</Text>
        {profile.addresses.length === 0 ? (
          <Text style={{ color: '#ccc' }}>No addresses added</Text>
        ) : (
          <FlatList
  data={profile.addresses}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.addressCard}
      onPress={() => {
        // Optional: navigate to map or show location
        console.log('Map for:', item.road);
      }}
    >
      <Text style={styles.cardTitle}>{item.road}</Text>
      <Text style={styles.cardText}>Building: {item.building_no}</Text>
      <Text style={styles.cardText}>Floor: {item.floor_num}</Text>
      <Text style={styles.cardText}>Apartment: {item.apartment_no}</Text>
    </TouchableOpacity>
  )}
/>

        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('BuyerProfileEdit', { profile })}
          style={styles.buttonWrapper}
        >
          <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  image: { width: 120, height: 120, borderRadius: 60, marginBottom: 20, borderWidth: 2, borderColor: '#fff' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { color: '#fff', fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', alignSelf: 'flex-start', marginBottom: 10 },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginBottom: 8,
    width: '100%',
  },
  addressText: { color: '#fff', fontSize: 14 },
  buttonWrapper: { marginTop: 20, width: '100%' },
  button: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  addressCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 70,
    paddingVertical:15,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  cardText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 2,
  },
});
