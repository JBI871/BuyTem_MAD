import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Image, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DeliverymanProfile({ userEmail, navigation }) {
  const [profile, setProfile] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const usersJSON = await AsyncStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : [];
        const user = users.find(u => u.email === userEmail && u.role === 'deliveryman');

        if (user) {
          setProfile(user);
          setIsAvailable(user.isAvailable ?? true);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchProfile();
  }, [userEmail]);

  const toggleAvailability = async () => {
    try {
      const usersJSON = await AsyncStorage.getItem('users');
      const users = usersJSON ? JSON.parse(usersJSON) : [];

      const updatedUsers = users.map(u => {
        if (u.email === userEmail && u.role === 'deliveryman') {
          return { ...u, isAvailable: !isAvailable };
        }
        return u;
      });

      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      setIsAvailable(prev => !prev);
    } catch (error) {
      console.log(error);
    }
  };

  if (!profile) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deliveryman Profile</Text>

      <Image
        source={profile.imageUri ? { uri: profile.imageUri } : require('../../assets/placeholderpp.png')}
        style={styles.image}
      />

      <Text>Name: {profile.name ?? 'N/A'}</Text>
      <Text>Contact: {profile.contact ?? 'N/A'}</Text>

      <View style={styles.statusRow}>
        <Text>Status: {isAvailable ? 'Available' : 'Unavailable'}</Text>
        <Switch value={isAvailable} onValueChange={toggleAvailability} />
      </View>

      <Button
        title="Edit Profile"
        onPress={() => navigation.navigate('DeliverymanProfileEdit', { userEmail })}
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
