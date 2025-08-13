import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BuyerProfile({ navigation, userEmail }) {
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
        const usersJSON = await AsyncStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : [];
        const user = users.find(u => u.email === userEmail);
        if (user) {
          setProfile({
            ...user,
            addresses: user.addresses || [], // ensure addresses exists
          });
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchProfile();
  }, [userEmail]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buyer Profile</Text>
      <Image
        source={profile.imageUri ? { uri: profile.imageUri } : require('../../assets/placeholderpp.png')}
        style={styles.image}
      />
      <Text>Name: {profile.name || 'N/A'}</Text>
      <Text>Email: {profile.email}</Text>
      <Text>Contact: {profile.contact || 'N/A'}</Text>

      <Text style={{ marginTop:20, fontWeight:'bold' }}>Delivery Addresses:</Text>
      {profile.addresses.length === 0 ? (
        <Text>No addresses added</Text>
      ) : (
        <FlatList
          data={profile.addresses}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <Text>{index + 1}. {item}</Text>
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
  container: { flex:1, padding:20, alignItems:'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom:20 },
  image: { width:100, height:100, borderRadius:50, marginBottom:20 }
});
