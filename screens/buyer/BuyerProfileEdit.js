import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { portLink } from '../../navigation/AppNavigation';

export default function BuyerProfileEdit({ route, navigation }) {
  const { profile } = route.params;

  const [name, setName] = useState(profile.name || '');
  const [contact, setContact] = useState(profile.contact || '');
  const [imageUri, setImageUri] = useState(profile.imageUri || null);
  const [addresses, setAddresses] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newAddress, setNewAddress] = useState({ apartment_no:'', building_no:'', floor_num:'', road:'' });
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
          const res = await fetch(`${portLink()}/addresses/user/${id}`, {
            headers: { 'Authorization': `Bearer ${tk}` }
          });
          const data = await res.json();
          if (res.ok) setAddresses(data);
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
    const result = await ImagePicker.launchImageLibraryAsync({ quality:0.5 });
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
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newAddress, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.error || 'Failed to add address'); return; }
      setAddresses([...addresses, { ...newAddress, id: data.id }]);
      setNewAddress({ apartment_no:'', building_no:'', floor_num:'', road:'' });
      setShowAddPanel(false);
      Alert.alert('Success', 'Address added!');
    } catch (err) { console.log('Add address error:', err); Alert.alert('Error', 'Something went wrong'); }
  };

  const handleRemoveAddress = async (id) => {
    try {
      const res = await fetch(`${portLink()}/addresses/${id}`, { method:'DELETE', headers:{ 'Authorization': `Bearer ${token}` }});
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.error || 'Failed to delete address'); return; }
      setAddresses(addresses.filter(addr => addr.id !== id));
    } catch (err) { console.log('Delete address error:', err); Alert.alert('Error', 'Something went wrong'); }
  };

  const handleEditAddress = async (id, field, value) => {
    try {
      const updatedAddress = addresses.find(addr => addr.id === id);
      const updateData = { ...updatedAddress, [field]: value };
      const res = await fetch(`${portLink()}/addresses/${id}`, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.error || 'Failed to update address'); return; }
      setAddresses(addresses.map(addr => addr.id === id ? updateData : addr));
    } catch (err) { console.log('Edit address error:', err); Alert.alert('Error', 'Something went wrong'); }
  };

  const saveProfile = async () => {
    try {
      const updateData = { name, phone: contact, image: imageUri };
      const res = await fetch(`${portLink()}/users/${userId}`, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.error || 'Failed to update profile'); return; }
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (err) { console.log('Update profile error:', err); Alert.alert('Error', 'Something went wrong'); }
  };

  return (
    <LinearGradient colors={['#0f2027','#203a43','#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit Profile</Text>

        <TouchableOpacity onPress={pickImage}>
          <Image source={imageUri ? { uri:imageUri } : require('../../assets/placeholderpp.png')} style={styles.image} />
          <Text style={{ color:'#1e90ff', marginTop:5, textAlign:'center' }}>Change Image</Text>
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#fff" style={styles.icon} />
          <TextInput placeholder="Name" placeholderTextColor="#ccc" value={name} onChangeText={setName} style={styles.input} />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="call-outline" size={20} color="#fff" style={styles.icon} />
          <TextInput placeholder="Contact" placeholderTextColor="#ccc" value={contact} onChangeText={setContact} style={styles.input} />
        </View>

        <Text style={[styles.sectionTitle,{ marginTop:20 }]}>Addresses</Text>
        {addresses.length === 0 ? <Text style={{ color:'#ccc' }}>No addresses added</Text> : (
          <FlatList
            data={addresses}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.addressBox}>
                <Ionicons name="location-outline" size={18} color="#fff" style={{ marginRight:5 }} />
                <Text style={{ color:'#fff', fontWeight:'bold', marginRight:8 }}>{index+1}.</Text>
                <TextInput
                  style={styles.addressInputHorizontal}
                  value={item.apartment_no}
                  placeholder="Apartment No"
                  placeholderTextColor="#ccc"
                  onChangeText={text => handleEditAddress(item.id, 'apartment_no', text)}
                />
                <TextInput
                  style={styles.addressInputHorizontal}
                  value={item.building_no}
                  placeholder="Building No"
                  placeholderTextColor="#ccc"
                  onChangeText={text => handleEditAddress(item.id, 'building_no', text)}
                />
                <TextInput
                  style={styles.addressInputHorizontal}
                  value={item.floor_num}
                  placeholder="Floor No"
                  placeholderTextColor="#ccc"
                  onChangeText={text => handleEditAddress(item.id, 'floor_num', text)}
                />
                <TextInput
                  style={styles.addressInputHorizontal}
                  value={item.road}
                  placeholder="Road"
                  placeholderTextColor="#ccc"
                  onChangeText={text => handleEditAddress(item.id, 'road', text)}
                />
                <TouchableOpacity onPress={() => handleRemoveAddress(item.id)} style={{ marginLeft:5 }}>
                  <Ionicons name="trash-outline" size={22} color="red" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <TouchableOpacity onPress={() => setShowAddPanel(!showAddPanel)} style={{marginVertical:10}}>
  <Text style={{color:'#1e90ff', fontWeight:'bold', textAlign:'center'}}>
    {showAddPanel ? 'Hide Add New Address' : 'Add New Address'}
  </Text>
</TouchableOpacity>

{showAddPanel && (
  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginBottom:15 }}>
    <View style={{ flexDirection:'row', alignItems:'center' }}>
      <TextInput
        placeholder="Apartment No"
        placeholderTextColor="#ccc"
        style={styles.addressInputHorizontal}
        value={newAddress.apartment_no}
        onChangeText={text => setNewAddress({ ...newAddress, apartment_no:text })}
      />
      <TextInput
        placeholder="Building No"
        placeholderTextColor="#ccc"
        style={styles.addressInputHorizontal}
        value={newAddress.building_no}
        onChangeText={text => setNewAddress({ ...newAddress, building_no:text })}
      />
      <TextInput
        placeholder="Floor No"
        placeholderTextColor="#ccc"
        style={styles.addressInputHorizontal}
        value={newAddress.floor_num}
        onChangeText={text => setNewAddress({ ...newAddress, floor_num:text })}
      />
      <TextInput
        placeholder="Road"
        placeholderTextColor="#ccc"
        style={styles.addressInputHorizontal}
        value={newAddress.road}
        onChangeText={text => setNewAddress({ ...newAddress, road:text })}
      />
      <TouchableOpacity onPress={handleAddAddress} style={{ marginLeft:5 }}>
        <LinearGradient colors={['#3a6b35','#2c4f25']} style={[styles.buttonGradient, { paddingHorizontal:12, paddingVertical:10 }]}>
          <Text style={styles.buttonText}>Add</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </ScrollView>
)}

        <TouchableOpacity onPress={saveProfile} style={styles.button}>
          <LinearGradient colors={['#3a6b35','#2c4f25']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Save Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1 },
  scroll:{ padding:20, alignItems:'center' },
  title:{ fontSize:28, fontWeight:'bold', color:'#fff', marginBottom:20 },
  image:{ width:120, height:120, borderRadius:60, marginBottom:10, borderWidth:2, borderColor:'#fff' },
  inputWrapper:{ flexDirection:'row', alignItems:'center', width:'100%', marginBottom:10, backgroundColor:'rgba(255,255,255,0.05)', borderRadius:8, paddingHorizontal:10 },
  icon:{ marginRight:8 },
  input:{ flex:1, color:'#fff', paddingVertical:8 },
  sectionTitle:{ fontSize:20, fontWeight:'bold', color:'#fff', alignSelf:'flex-start', marginBottom:10 },
  addressBox:{ flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.05)', padding:8, borderRadius:10, marginBottom:10, flexWrap:'nowrap' },
  addressInputHorizontal:{ borderWidth:1, borderColor:'#ccc', borderRadius:5, padding:5, marginRight:5, color:'#fff', flex:1 },
  button:{ width:'100%', marginVertical:5 },
  buttonGradient:{ paddingVertical:14, borderRadius:10, alignItems:'center' },
  buttonText:{ color:'#fff', fontWeight:'bold', fontSize:16 }
});
