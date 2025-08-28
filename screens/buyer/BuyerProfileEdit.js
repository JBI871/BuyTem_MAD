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
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit Profile</Text>

        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          <Image source={imageUri ? { uri:imageUri } : require('../../assets/placeholderpp.png')} style={styles.image} />
          <View style={styles.changeImageButton}>
            <Ionicons name="camera" size={20} color="#8B3E1A" />
            <Text style={styles.changeImageText}>Change Image</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#8B3E1A" style={styles.icon} />
          <TextInput 
            placeholder="Name" 
            placeholderTextColor="#C75D2C" 
            value={name} 
            onChangeText={setName} 
            style={styles.input} 
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="call-outline" size={20} color="#8B3E1A" style={styles.icon} />
          <TextInput 
            placeholder="Contact" 
            placeholderTextColor="#C75D2C" 
            value={contact} 
            onChangeText={setContact} 
            style={styles.input} 
          />
        </View>

        {/* Addresses Section */}
        <Text style={[styles.sectionTitle, { marginTop:20 }]}>Addresses</Text>
        {addresses.length === 0 ? (
          <Text style={styles.noDataText}>No addresses added</Text>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.addressCard}>
                <TouchableOpacity style={styles.removeIcon} onPress={() => handleRemoveAddress(item.id)}>
                  <Ionicons name="trash-outline" size={22} color="#C75D2C" />
                </TouchableOpacity>
                <View style={{ paddingRight:30 }}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="location-outline" size={16} color="#8B3E1A" style={{ marginRight: 6 }} />
                    <Text style={styles.cardTitle}>{item.road}</Text>
                  </View>
                  <Text style={styles.cardText}>Building: {item.building_no}</Text>
                  <Text style={styles.cardText}>Floor: {item.floor_num}</Text>
                  <Text style={styles.cardText}>Apartment: {item.apartment_no}</Text>
                </View>
              </View>
            )}
          />
        )}
        <TouchableOpacity onPress={() => setShowAddressModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={20} color="#D96F32" style={{ marginRight: 6 }} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>

        {/* Payment Methods Section */}
        <Text style={[styles.sectionTitle, { marginTop:20 }]}>Payment Methods</Text>
        {paymentMethods.length === 0 ? (
          <Text style={styles.noDataText}>No payment methods added</Text>
        ) : (
          <FlatList
            data={paymentMethods}
            keyExtractor={(item) => item.payment_id}
            renderItem={({ item }) => (
              <View style={styles.addressCard}>
                <TouchableOpacity style={styles.removeIcon} onPress={() => handleRemovePayment(item.payment_id)}>
                  <Ionicons name="trash-outline" size={22} color="#C75D2C" />
                </TouchableOpacity>
                <View style={{ paddingRight:30 }}>
                  <View style={styles.cardHeader}>
                    <Ionicons 
                      name={item.payment_method === 'Card' ? 'card-outline' : 'phone-portrait-outline'} 
                      size={16} 
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
              </View>
            )}
          />
        )}
        <TouchableOpacity onPress={() => setShowPaymentModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={20} color="#D96F32" style={{ marginRight: 6 }} />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={saveProfile} style={styles.button}>
          <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.buttonGradient}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#F3E9DC" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Save Profile</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Address Modal */}
        <Modal visible={showAddressModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TextInput 
                placeholder="Road" 
                placeholderTextColor="#C75D2C" 
                style={styles.modalInput} 
                value={newAddress.road} 
                onChangeText={text => setNewAddress({ ...newAddress, road: text })} 
              />
              <TextInput 
                placeholder="Building No" 
                placeholderTextColor="#C75D2C" 
                style={styles.modalInput} 
                value={newAddress.building_no} 
                onChangeText={text => setNewAddress({ ...newAddress, building_no: text })} 
              />
              <TextInput 
                placeholder="Floor No" 
                placeholderTextColor="#C75D2C" 
                style={styles.modalInput} 
                value={newAddress.floor_num} 
                onChangeText={text => setNewAddress({ ...newAddress, floor_num: text })} 
              />
              <TextInput 
                placeholder="Apartment No" 
                placeholderTextColor="#C75D2C" 
                style={styles.modalInput} 
                value={newAddress.apartment_no} 
                onChangeText={text => setNewAddress({ ...newAddress, apartment_no: text })} 
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                  <LinearGradient colors={['#C75D2C', '#8B3E1A']} style={[styles.modalButton, { backgroundColor: 'transparent' }]}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddAddress}>
                  <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.modalButton}>
                    <Text style={styles.modalButtonText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>

        {/* Payment Modal */}
        <Modal visible={showPaymentModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <View style={styles.paymentTypeSelector}>
                <TouchableOpacity 
                  onPress={() => setNewPayment({ ...newPayment, type:'Card' })}
                  style={[styles.paymentTypeButton, newPayment.type === 'Card' && styles.activePaymentType]}
                >
                  <Ionicons name="card-outline" size={20} color={newPayment.type === 'Card' ? '#F3E9DC' : '#8B3E1A'} />
                  <Text style={[styles.paymentTypeText, { color: newPayment.type === 'Card' ? '#F3E9DC' : '#8B3E1A' }]}>Card</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setNewPayment({ ...newPayment, type:'Bkash' })}
                  style={[styles.paymentTypeButton, newPayment.type === 'Bkash' && styles.activePaymentType]}
                >
                  <Ionicons name="phone-portrait-outline" size={20} color={newPayment.type === 'Bkash' ? '#F3E9DC' : '#8B3E1A'} />
                  <Text style={[styles.paymentTypeText, { color: newPayment.type === 'Bkash' ? '#F3E9DC' : '#8B3E1A' }]}>Bkash</Text>
                </TouchableOpacity>
              </View>
              {newPayment.type === 'Card' ? (
                <>
                  <TextInput placeholder="Card Number" placeholderTextColor="#C75D2C" style={styles.modalInput} value={newPayment.card_number} onChangeText={text => setNewPayment({...newPayment, card_number:text})}/>
                  <TextInput placeholder="Card Holder Name" placeholderTextColor="#C75D2C" style={styles.modalInput} value={newPayment.card_holder} onChangeText={text => setNewPayment({...newPayment, card_holder:text})}/>
                  <TextInput placeholder="Security Code" placeholderTextColor="#C75D2C" style={styles.modalInput} value={newPayment.security_code} onChangeText={text => setNewPayment({...newPayment, security_code:text})}/>
                  <TextInput placeholder="Expire Date" placeholderTextColor="#C75D2C" style={styles.modalInput} value={newPayment.expire_date} onChangeText={text => setNewPayment({...newPayment, expire_date:text})}/>
                </>
              ) : (
                <TextInput placeholder="Bkash Number" placeholderTextColor="#C75D2C" style={styles.modalInput} value={newPayment.bkash_number} onChangeText={text => setNewPayment({...newPayment, bkash_number:text})}/>
              )}
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:20 }}>
                <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                  <LinearGradient colors={['#C75D2C', '#8B3E1A']} style={[styles.modalButton, { backgroundColor: 'transparent' }]}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddPayment}>
                  <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.modalButton}>
                    <Text style={styles.modalButtonText}>Save</Text>
                  </LinearGradient>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  image: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    marginBottom: 10, 
    borderWidth: 3, 
    borderColor: '#D96F32'
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 233, 220, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D96F32',
  },
  changeImageText: { 
    color: '#8B3E1A', 
    marginLeft: 4, 
    fontWeight: '600'
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: 12, 
    backgroundColor: 'rgba(243, 233, 220, 0.9)', 
    borderRadius: 10, 
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.3)',
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: '#8B3E1A', paddingVertical: 12, fontWeight: '500' },
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
  button: { width: '100%', marginVertical: 5 },
  buttonGradient: { 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#8B3E1A',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: { 
    color: '#F3E9DC', 
    fontWeight: 'bold', 
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  addressCard: {
    backgroundColor: 'rgba(243, 233, 220, 0.9)',
    paddingLeft: 15,
    paddingRight: 15,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.3)',
    shadowColor: '#C75D2C',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  removeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(243, 233, 220, 0.9)',
    borderRadius: 15,
    padding: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
    marginBottom: 2,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: 'rgba(243, 233, 220, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D96F32',
  },
  addButtonText: {
    color: '#D96F32',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#C75D2C',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: '#8B3E1A',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D96F32',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    color: '#8B3E1A',
    backgroundColor: 'rgba(243, 233, 220, 0.9)',
    fontWeight: '500',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#8B3E1A',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modalButtonText: { 
    color: '#F3E9DC', 
    fontWeight: 'bold', 
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  paymentTypeSelector: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 15 
  },
  paymentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8B3E1A',
    backgroundColor: 'rgba(243, 233, 220, 0.5)',
  },
  activePaymentType: {
    backgroundColor: '#C75D2C',
    borderColor: '#8B3E1A',
  },
  paymentTypeText: {
    fontWeight: 'bold',
    marginLeft: 6,
  },
});