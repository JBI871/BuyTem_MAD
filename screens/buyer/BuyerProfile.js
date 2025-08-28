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
    paymentMethods: [],
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

        // Fetch profile
        const resProfile = await fetch(`${portLink()}/users/by_id/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataProfile = await resProfile.json();
        if (!resProfile.ok) {
          Alert.alert('Error', dataProfile.error || 'Failed to fetch profile');
          return;
        }

        // Fetch addresses
        const resAddresses = await fetch(`${portLink()}/addresses/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataAddresses = resAddresses.ok ? await resAddresses.json() : [];

        // Fetch payment methods
        const resPayments = await fetch(`${portLink()}/payment/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataPayments = resPayments.ok ? await resPayments.json() : [];

        setProfile({
          name: dataProfile.name || '',
          contact: dataProfile.phone || '',
          email: dataProfile.email || '',
          imageUri: dataProfile.image || null,
          addresses: dataAddresses || [],
          paymentMethods: dataPayments || [],
        });
      } catch (err) {
        console.log('Fetch profile error:', err);
        Alert.alert('Error', 'Something went wrong while fetching profile');
      }
    };

    fetchProfile();
  }, []);

  return (
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Buyer Profile</Text>

        <View style={styles.imageContainer}>
          <Image
            source={profile.imageUri ? { uri: profile.imageUri } : require('../../assets/placeholderpp.png')}
            style={styles.image}
          />
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#8B3E1A" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>{profile.name || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#8B3E1A" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>{profile.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#8B3E1A" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>{profile.contact || 'N/A'}</Text>
        </View>

        {/* Delivery Addresses */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Delivery Addresses:</Text>
        {profile.addresses.length === 0 ? (
          <Text style={styles.noDataText}>No addresses added</Text>
        ) : (
          <FlatList
            data={profile.addresses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.addressCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="location-outline" size={18} color="#8B3E1A" style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>{item.road}</Text>
                </View>
                <Text style={styles.cardText}>Building: {item.building_no}</Text>
                <Text style={styles.cardText}>Floor: {item.floor_num}</Text>
                <Text style={styles.cardText}>Apartment: {item.apartment_no}</Text>
              </View>
            )}
          />
        )}

        {/* Payment Methods */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payment Methods:</Text>
        {profile.paymentMethods.length === 0 ? (
          <Text style={styles.noDataText}>No payment methods added</Text>
        ) : (
          <FlatList
            data={profile.paymentMethods}
            keyExtractor={(item) => item.payment_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.addressCard}>
                <View style={styles.cardHeader}>
                  <Ionicons 
                    name={item.payment_method === 'Card' ? 'card-outline' : 'phone-portrait-outline'} 
                    size={18} 
                    color="#8B3E1A" 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={styles.cardTitle}>{item.payment_method}</Text>
                </View>
                {item.payment_method === 'Card' ? (
                  <>
                    <Text style={styles.cardText}>Card Number: {item.payment_credential.card_number}</Text>
                    <Text style={styles.cardText}>Holder: {item.payment_credential.card_holder}</Text>
                    <Text style={styles.cardText}>Expire: {item.payment_credential.expire_date}</Text>
                  </>
                ) : (
                  <Text style={styles.cardText}>Bkash Number: {item.payment_credential.bkash_number}</Text>
                )}
              </View>
            )}
          />
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('BuyerProfileEdit', { profile })}
          style={styles.buttonWrapper}
        >
          <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.button}>
            <Ionicons name="create-outline" size={20} color="#F3E9DC" style={{ marginRight: 8 }} />
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
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#8B3E1A', 
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageContainer: {
    shadowColor: '#C75D2C',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 20,
  },
  image: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    borderWidth: 3, 
    borderColor: '#D96F32'
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    backgroundColor: 'rgba(243, 233, 220, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.3)',
  },
  infoText: { 
    color: '#8B3E1A', 
    fontSize: 16, 
    fontWeight: '500',
    flex: 1,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#8B3E1A', 
    alignSelf: 'flex-start', 
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  noDataText: { 
    color: '#C75D2C', 
    fontStyle: 'italic',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  addressCard: {
    backgroundColor: 'rgba(243, 233, 220, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.3)',
    shadowColor: '#C75D2C',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#8B3E1A',
    flex: 1,
  },
  cardText: { 
    color: '#C75D2C', 
    fontSize: 14, 
    marginBottom: 4,
    fontWeight: '500',
  },
  buttonWrapper: { 
    marginTop: 20, 
    width: '100%',
    shadowColor: '#8B3E1A',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  button: { 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: { 
    color: '#F3E9DC', 
    fontWeight: 'bold', 
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});