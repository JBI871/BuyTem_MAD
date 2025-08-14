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
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.loadingContainer}>
      <Text style={{ color: '#fff', fontSize: 16 }}>Loading...</Text>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>User Profile</Text>

          <Image
            source={profile.image ? { uri: profile.image } : require('../../assets/placeholderpp.png')}
            style={styles.image}
          />

          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{profile.name ?? 'N/A'}</Text>

          <Text style={styles.label}>Contact:</Text>
          <Text style={styles.value}>{profile.phone ?? 'N/A'}</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('DeliverymanProfileEdit')}
            style={styles.buttonWrapper}
          >
            <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
              <Text style={styles.buttonText}>Edit Profile</Text>
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
    marginBottom: 20,
    alignSelf: 'center',
  },
  label: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 10,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonWrapper: {
    marginTop: 25,
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
