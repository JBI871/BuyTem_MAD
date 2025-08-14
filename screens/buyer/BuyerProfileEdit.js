import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {portLink} from '../../navigation/AppNavigation'
export default function BuyerProfileEdit({ route, navigation }) {
  const { profile } = route.params;

  const [name, setName] = useState(profile.name || '');
  const [contact, setContact] = useState(profile.contact || '');
  const [imageUri, setImageUri] = useState(profile.imageUri || null);
  const [addresses, setAddresses] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newAddress, setNewAddress] = useState({
    apartment_no: '',
    building_no: '',
    floor_num: '',
    road: '',
  });

  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      const id = await AsyncStorage.getItem('userId');
      const tk = await AsyncStorage.getItem('token');
      setUserId(id);
      setToken(tk);

      if (id && tk) {
        try {
          // GET addresses with ID
          const res = await fetch(`${portLink()}/addresses/user/${id}`, {
            headers: { 'Authorization': `Bearer ${tk}` }
          });
          const data = await res.json();
          if (res.ok) setAddresses(data); // data has id field but we won't show it
        } catch (err) {
          console.log('Fetch addresses error:', err);
        }
      }
    };
    loadUserData();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission denied', 'You need to allow access to media library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!result.cancelled) setImageUri(result.uri);
  };

  const handleAddAddress = async () => {
    const { apartment_no, building_no, floor_num, road } = newAddress;
    if (!apartment_no || !building_no || !floor_num || !road) {
      Alert.alert('Error', 'All address fields are required');
      return;
    }

    try {
      const res = await fetch(`${portLink()}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newAddress, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Failed to add address');
        return;
      }

      setAddresses([...addresses, { ...newAddress, id: data.id }]);
      setNewAddress({ apartment_no: '', building_no: '', floor_num: '', road: '' });
      setShowAddPanel(false);
      Alert.alert('Success', 'Address added!');
    } catch (err) {
      console.log('Add address error:', err);
      Alert.alert('Error', 'Something went wrong while adding address');
    }
  };

  const handleRemoveAddress = async (id) => {
    try {
      const res = await fetch(`${portLink()}/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Failed to delete address');
        return;
      }

      setAddresses(addresses.filter(addr => addr.id !== id));
    } catch (err) {
      console.log('Delete address error:', err);
      Alert.alert('Error', 'Something went wrong while deleting address');
    }
  };

  const handleEditAddress = async (id, field, value) => {
    try {
      const updatedAddress = addresses.find(addr => addr.id === id);
      const updateData = { ...updatedAddress, [field]: value };

      const res = await fetch(`${portLink()}/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Failed to update address');
        return;
      }

      setAddresses(addresses.map(addr => addr.id === id ? updateData : addr));
    } catch (err) {
      console.log('Edit address error:', err);
      Alert.alert('Error', 'Something went wrong while updating address');
    }
  };

  const saveProfile = async () => {
    try {
      const updateData = { name, phone: contact, image: imageUri };
      const res = await fetch(`${portLink()}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Failed to update profile');
        return;
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (err) {
      console.log('Update profile error:', err);
      Alert.alert('Error', 'Something went wrong while updating profile');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={imageUri ? { uri: imageUri } : require('../../assets/placeholderpp.png')}
          style={styles.image}
        />
        <Text style={{ color: 'blue', marginTop:5 }}>Change Image</Text>
      </TouchableOpacity>

      <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Contact" value={contact} onChangeText={setContact} style={styles.input} />

      <Text style={{ fontWeight:'bold', marginTop: 10 }}>Addresses</Text>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.addressRow}>
            <TextInput
              style={styles.inputSmall}
              value={item.apartment_no}
              onChangeText={(text) => handleEditAddress(item.id, 'apartment_no', text)}
              placeholder="Apartment No"
            />
            <TextInput
              style={styles.inputSmall}
              value={item.building_no}
              onChangeText={(text) => handleEditAddress(item.id, 'building_no', text)}
              placeholder="Building No"
            />
            <TextInput
              style={styles.inputSmall}
              value={item.floor_num}
              onChangeText={(text) => handleEditAddress(item.id, 'floor_num', text)}
              placeholder="Floor No"
            />
            <TextInput
              style={styles.inputSmall}
              value={item.road}
              onChangeText={(text) => handleEditAddress(item.id, 'road', text)}
              placeholder="Road"
            />
            <Button title="Remove" color="red" onPress={() => handleRemoveAddress(item.id)} />
          </View>
        )}
      />

      <TouchableOpacity onPress={() => setShowAddPanel(!showAddPanel)} style={{marginVertical:10}}>
        <Text style={{color:'blue', fontWeight:'bold'}}>
          {showAddPanel ? 'Hide Add New Address' : 'Add New Address'}
        </Text>
      </TouchableOpacity>

      {showAddPanel && (
        <>
          <TextInput
            placeholder="Apartment No"
            value={newAddress.apartment_no}
            onChangeText={(text) => setNewAddress({ ...newAddress, apartment_no: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Building No"
            value={newAddress.building_no}
            onChangeText={(text) => setNewAddress({ ...newAddress, building_no: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Floor No"
            value={newAddress.floor_num}
            onChangeText={(text) => setNewAddress({ ...newAddress, floor_num: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Road"
            value={newAddress.road}
            onChangeText={(text) => setNewAddress({ ...newAddress, road: text })}
            style={styles.input}
          />
          <Button title="Add Address" onPress={handleAddAddress} />
        </>
      )}

      <View style={{ marginTop:20 }}>
        <Button title="Save Profile" onPress={saveProfile} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20 },
  title: { fontSize:24, fontWeight:'bold', marginBottom:20, textAlign:'center' },
  input: { borderWidth:1, borderRadius:5, padding:8, marginVertical:5 },
  inputSmall: { borderWidth:1, borderRadius:5, padding:5, marginVertical:2, flex:1 },
  image: { width:100, height:100, borderRadius:50, alignSelf:'center', marginBottom:10 },
  addressRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' }
});
