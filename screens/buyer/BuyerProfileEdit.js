import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert, StyleSheet, ScrollView, Modal } from 'react-native';
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
  const [showModal, setShowModal] = useState(false);
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
      setShowModal(false);
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
          <Text style={{ color:'#1e90ff', marginBottom:10, textAlign:'center' }}>Change Image</Text>
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
  data={profile.addresses}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <View style={styles.addressCard}>
      {/* Remove Icon at top-right */}
      <TouchableOpacity
        style={styles.removeIcon}
        onPress={() => handleRemoveAddress(item.id)}
      >
        <Ionicons name="trash-outline" size={22} color="red" />
      </TouchableOpacity>

      {/* Address Text */}
      <TouchableOpacity
        style={{ paddingRight: 30 }} // space so text doesn't go under icon
        onPress={() => console.log('Map for:', item.road)}
      >
        <Text style={styles.cardTitle}>{item.road}</Text>
        <Text style={styles.cardText}>Building: {item.building_no}</Text>
        <Text style={styles.cardText}>Floor: {item.floor_num}</Text>
        <Text style={styles.cardText}>Apartment: {item.apartment_no}</Text>
      </TouchableOpacity>
    </View>
  )}
/>

        )}

        <TouchableOpacity onPress={() => setShowModal(true)} style={{marginVertical:10}}>
          <Text style={{color:'#1e90ff', fontWeight:'bold', textAlign:'center'}}>Add New Address</Text>
        </TouchableOpacity>

        {/* Modal Form */}
       <Modal visible={showModal} transparent={true} animationType="slide">
  <View style={styles.modalOverlay}>
    <LinearGradient
      colors={['#0f2027', '#203a43', '#2c5364']}
      style={styles.modalContent}
    >
      <Text style={styles.modalTitle}>Add New Address</Text>
      <TextInput
        placeholder="Road"
        placeholderTextColor="#ccc"
        style={styles.modalInput}
        value={newAddress.road}
        onChangeText={text => setNewAddress({ ...newAddress, road: text })}
      />
      <TextInput
        placeholder="Building No"
        placeholderTextColor="#ccc"
        style={styles.modalInput}
        value={newAddress.building_no}
        onChangeText={text => setNewAddress({ ...newAddress, building_no: text })}
      />
      <TextInput
        placeholder="Floor No"
        placeholderTextColor="#ccc"
        style={styles.modalInput}
        value={newAddress.floor_num}
        onChangeText={text => setNewAddress({ ...newAddress, floor_num: text })}
      />
      <TextInput
        placeholder="Apartment No"
        placeholderTextColor="#ccc"
        style={styles.modalInput}
        value={newAddress.apartment_no}
        onChangeText={text => setNewAddress({ ...newAddress, apartment_no: text })}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.modalButton, { backgroundColor: 'gray' }]}>
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddAddress} style={styles.modalButton}>
          <Text style={styles.modalButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  </View>
</Modal>

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
  button:{ width:'100%', marginVertical:5 },
  buttonGradient:{ paddingVertical:14, borderRadius:10, alignItems:'center' },
  buttonText:{ color:'#fff', fontWeight:'bold', fontSize:16 },

addressCard: {
  backgroundColor: 'rgba(255,255,255,0.05)',
  paddingLeft: 70,
  paddingRight: 70,
  paddingVertical: 15,
  borderRadius: 10,
  marginBottom: 12,
  width: '100%',
  position: 'relative', // needed for absolute icon positioning
},

removeIcon: {
  position: 'absolute',
  top: 10,
  right: 10,
  zIndex: 1,
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

  // Modal styles
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)', // keeps dim effect
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  width: '90%',
  borderRadius: 10,
  padding: 20,
},
modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#fff' },
modalInput: {
  borderWidth: 1,
  borderColor: '#555',
  borderRadius: 8,
  padding: 10,
  marginBottom: 10,
  color: '#fff',
  backgroundColor: 'rgba(255,255,255,0.05)',
},
modalButton: {
  flex: 1,
  backgroundColor: '#3a6b35',
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginHorizontal: 5,
},
modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

});
