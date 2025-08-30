import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

export default function UserProfile({ navigation }) {
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const tk = await AsyncStorage.getItem('token');
        const id = await AsyncStorage.getItem('userId');
        setToken(tk);
        setUserId(id);

        const res = await fetch(`${portLink()}/users/by_id/${id}`, {
          headers: { 'Authorization': `Bearer ${tk}` }
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert('Error', data.error || 'Failed to fetch user');
          return;
        }
        setProfile(data);
      } catch (err) {
        console.log('Fetch user error:', err);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) return (
    <LinearGradient colors={['#F3E9DC', '#F8B259']} style={styles.loadingContainer}>
      <Text style={{ color: '#C75D2C', fontSize: 16 }}>Loading...</Text>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#F3E9DC', '#F8B259']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>User Profile</Text>

          <View style={styles.imageContainer}>
            <Image
              source={profile.image ? { uri: profile.image } : require('../../assets/placeholderpp.png')}
              style={styles.image}
            />
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{profile.name ?? 'N/A'}</Text>

            <Text style={styles.label}>Contact:</Text>
            <Text style={styles.value}>{profile.phone ?? 'N/A'}</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('DeliverymanProfileEdit')}
            style={styles.buttonWrapper}
          >
            <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.button}>
              <Text style={styles.buttonText}>Edit Profile</Text>
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
  infoSection: {
    backgroundColor: 'rgba(243, 233, 220, 0.4)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.1)',
  },
  label: {
    color: '#D96F32',
    fontSize: 15,
    marginTop: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: '#C75D2C',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
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