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
  const [paymentMethods, setPaymentMethods] = useState(profile.paymentMethods || []);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({ apartment_no:'', building_no:'', floor_num:'', road:'' });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({ type: 'Card', card_number:'', card_holder:'', security_code:'', expire_date:'', bkash_number:'' });

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
          const resAddr = await fetch(`${portLink()}/addresses/user/${id}`, { headers: { 'Authorization': `Bearer ${tk}` } });
          const addrData = resAddr.ok ? await resAddr.json() : [];
          setAddresses(addrData);

          const resPay = await fetch(`${portLink()}/payment/${id}`, { headers: { 'Authorization': `Bearer ${tk}` } });
          const payData = resPay.ok ? await resPay.json() : [];
          setPaymentMethods(payData);
        } catch (err) {
          console.log('Fetch data error:', err);
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

  // Address functions
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
      setShowAddressModal(false);
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

  // Payment functions
  const handleAddPayment = async () => {
    if (newPayment.type === 'Card') {
      if (!newPayment.card_number || !newPayment.card_holder || !newPayment.security_code || !newPayment.expire_date) {
        Alert.alert('Error', 'All card fields are required');
        return;
      }
    } else if (newPayment.type === 'Bkash') {
      if (!newPayment.bkash_number) {
        Alert.alert('Error', 'Bkash number is required');
        return;
      }
    }

    const paymentCredential = newPayment.type === 'Card' 
      ? { card_number: newPayment.card_number, card_holder: newPayment.card_holder, security_code: newPayment.security_code, expire_date: newPayment.expire_date } 
      : { bkash_number: newPayment.bkash_number };

    try {
      const res = await fetch(`${portLink()}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, payment_method: newPayment.type, payment_credential: paymentCredential })
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.error || 'Failed to add payment'); return; }

      setPaymentMethods([...paymentMethods, { payment_id: data.payment_id, payment_method: newPayment.type, payment_credential: paymentCredential }]);
      setNewPayment({ type: 'Card', card_number:'', card_holder:'', security_code:'', expire_date:'', bkash_number:'' });
      setShowPaymentModal(false);
      Alert.alert('Success', 'Payment method added!');
    } catch(err) {
      console.log('Add payment error:', err);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleRemovePayment = async (payment_id) => {
    try {
      const res = await fetch(`${portLink()}/payment/${userId}/${payment_id}`, { method: 'DELETE', headers:{ 'Authorization': `Bearer ${token}` }});
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.error || 'Failed to delete payment'); return; }

      setPaymentMethods(paymentMethods.filter(pm => pm.payment_id !== payment_id));
    } catch(err) { console.log('Delete payment error:', err); Alert.alert('Error', 'Something went wrong'); }
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

        {/* Addresses Section */}
        <Text style={[styles.sectionTitle,{ marginTop:20 }]}>Addresses</Text>
        {addresses.length === 0 ? <Text style={{ color:'#ccc' }}>No addresses added</Text> : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.addressCard}>
                <TouchableOpacity style={styles.removeIcon} onPress={() => handleRemoveAddress(item.id)}>
                  <Ionicons name="trash-outline" size={22} color="red" />
                </TouchableOpacity>
                <View style={{ paddingRight:30 }}>
                  <Text style={styles.cardTitle}>{item.road}</Text>
                  <Text style={styles.cardText}>Building: {item.building_no}</Text>
                  <Text style={styles.cardText}>Floor: {item.floor_num}</Text>
                  <Text style={styles.cardText}>Apartment: {item.apartment_no}</Text>
                </View>
              </View>
            )}
          />
        )}
        <TouchableOpacity onPress={() => setShowAddressModal(true)} style={{marginVertical:10}}>
          <Text style={{color:'#1e90ff', fontWeight:'bold', textAlign:'center'}}>Add New Address</Text>
        </TouchableOpacity>

        {/* Payment Methods Section */}
        <Text style={[styles.sectionTitle,{ marginTop:20 }]}>Payment Methods</Text>
        {paymentMethods.length === 0 ? <Text style={{ color:'#ccc' }}>No payment methods added</Text> : (
          <FlatList
            data={paymentMethods}
            keyExtractor={(item) => item.payment_id}
            renderItem={({ item }) => (
              <View style={styles.addressCard}>
                <TouchableOpacity style={styles.removeIcon} onPress={() => handleRemovePayment(item.payment_id)}>
                  <Ionicons name="trash-outline" size={22} color="red" />
                </TouchableOpacity>
                <View style={{ paddingRight:30 }}>
                  <Text style={styles.cardTitle}>{item.payment_method}</Text>
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
              </View>
            )}
          />
        )}
        <TouchableOpacity onPress={() => setShowPaymentModal(true)} style={{marginVertical:10}}>
          <Text style={{color:'#1e90ff', fontWeight:'bold', textAlign:'center'}}>Add Payment Method</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={saveProfile} style={styles.button}>
          <LinearGradient colors={['#3a6b35','#2c4f25']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Save Profile</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Address Modal */}
        <Modal visible={showAddressModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#0f2027','#203a43','#2c5364']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TextInput placeholder="Road" placeholderTextColor="#ccc" style={styles.modalInput} value={newAddress.road} onChangeText={text => setNewAddress({ ...newAddress, road: text })} />
              <TextInput placeholder="Building No" placeholderTextColor="#ccc" style={styles.modalInput} value={newAddress.building_no} onChangeText={text => setNewAddress({ ...newAddress, building_no: text })} />
              <TextInput placeholder="Floor No" placeholderTextColor="#ccc" style={styles.modalInput} value={newAddress.floor_num} onChangeText={text => setNewAddress({ ...newAddress, floor_num: text })} />
              <TextInput placeholder="Apartment No" placeholderTextColor="#ccc" style={styles.modalInput} value={newAddress.apartment_no} onChangeText={text => setNewAddress({ ...newAddress, apartment_no: text })} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                <TouchableOpacity onPress={() => setShowAddressModal(false)} style={[styles.modalButton, { backgroundColor: 'gray' }]}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddAddress} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>

        {/* Payment Modal */}
        <Modal visible={showPaymentModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#0f2027','#203a43','#2c5364']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <View style={{ flexDirection:'row', justifyContent:'space-around', marginBottom:10 }}>
                <TouchableOpacity onPress={() => setNewPayment({ ...newPayment, type:'Card' })}>
                  <Text style={{ color: newPayment.type==='Card' ? '#1e90ff':'#fff', fontWeight:'bold' }}>Card</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setNewPayment({ ...newPayment, type:'Bkash' })}>
                  <Text style={{ color: newPayment.type==='Bkash' ? '#1e90ff':'#fff', fontWeight:'bold' }}>Bkash</Text>
                </TouchableOpacity>
              </View>
              {newPayment.type==='Card' ? (
                <>
                  <TextInput placeholder="Card Number" placeholderTextColor="#ccc" style={styles.modalInput} value={newPayment.card_number} onChangeText={text => setNewPayment({...newPayment, card_number:text})}/>
                  <TextInput placeholder="Card Holder Name" placeholderTextColor="#ccc" style={styles.modalInput} value={newPayment.card_holder} onChangeText={text => setNewPayment({...newPayment, card_holder:text})}/>
                  <TextInput placeholder="Security Code" placeholderTextColor="#ccc" style={styles.modalInput} value={newPayment.security_code} onChangeText={text => setNewPayment({...newPayment, security_code:text})}/>
                  <TextInput placeholder="Expire Date" placeholderTextColor="#ccc" style={styles.modalInput} value={newPayment.expire_date} onChangeText={text => setNewPayment({...newPayment, expire_date:text})}/>
                </>
              ) : (
                <TextInput placeholder="Bkash Number" placeholderTextColor="#ccc" style={styles.modalInput} value={newPayment.bkash_number} onChangeText={text => setNewPayment({...newPayment, bkash_number:text})}/>
              )}
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:20 }}>
                <TouchableOpacity onPress={()=>setShowPaymentModal(false)} style={[styles.modalButton,{ backgroundColor:'gray' }]}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddPayment} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>

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
    position: 'relative',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
