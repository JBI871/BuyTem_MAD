import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Image, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {portLink} from '../../navigation/AppNavigation'

export default function UserProfile({ navigation }) {
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const tk = await AsyncStorage.getItem('token');
        const id = await AsyncStorage.getItem('userId'); // load userId from storage
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



  if (!profile) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>

      <Image
        source={profile.image ? { uri: profile.image } : require('../../assets/placeholderpp.png')}
        style={styles.image}
      />

      <Text>Name: {profile.name ?? 'N/A'}</Text>
      <Text>Contact: {profile.phone ?? 'N/A'}</Text>

      {/* <View style={styles.statusRow}>
        <Text>Status: {isAvailable ? 'Available' : 'Unavailable'}</Text>
        <Switch value={isAvailable} onValueChange={toggleAvailability} />
      </View> */}

      <Button
        title="Edit Profile"
        onPress={() => navigation.navigate('DeliverymanProfileEdit')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
  image: { width: 120, height: 120, borderRadius: 60, marginBottom: 20, alignSelf: 'center' },
});
