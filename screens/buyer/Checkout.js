import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ScrollView, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

export default function CheckoutScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const [tip, setTip] = useState(0);


  
  // Fetch Cart
const fetchCart = async () => {
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');

    if (!token) {
      Alert.alert('Error', 'You must be logged in');
      setLoading(false);
      return;
    }

    // 1️⃣ Fetch cart items
    const cartRes = await fetch(`${portLink()}/cart/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!cartRes.ok) throw new Error('Failed to fetch cart');
    const cartData = await cartRes.json();

    // 2️⃣ Fetch product info for each cart item
    const itemsWithInfo = await Promise.all(
      cartData.items.map(async (item) => {
        const productRes = await fetch(`${portLink()}/products/${item.product_id}`);
        if (!productRes.ok) throw new Error('Failed to fetch product info');
        const product = await productRes.json();

        const discount = product.discount || 0;
        const finalPrice =
          discount > 0 ? product.price - discount * 0.01 * product.price : product.price;

        return {
          product_id: item.product_id,
          product_name: product.name,
          product_price: product.price,
          discount,
          quantity: item.quantity,
          item_total: finalPrice * item.quantity,
        };
      })
    );

    const total = itemsWithInfo.reduce((sum, item) => sum + item.item_total, 0);

    setCartItems(itemsWithInfo);
    setTotalAmount(total);
  } catch (err) {
    console.error(err);
    Alert.alert('Error', 'Could not fetch cart');
  } finally {
    setLoading(false);
  }
};


  // Fetch Addresses
  const fetchAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${portLink()}/addresses/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 404) { setAddresses([]); return; }
      if (!response.ok) throw new Error('Failed to fetch addresses');
      const data = await response.json();
      setAddresses(data);
    } catch (err) { console.error(err); }
  };

  // Fetch Payment Methods
  const fetchPaymentMethods = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!userId || !token) { Alert.alert('Error', 'User not logged in'); return; }

      const response = await fetch(`${portLink()}/payment/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch payment methods');

      const data = await response.json();
      let methods = data.map(item => ({
        payment_id: item.payment_id,
        user_id: item.user_id,
        payment_method: item.payment_method,
        payment_credential: item.payment_credential || {}
      }));

      // Always ensure COD exists
      const codExists = methods.some(m => m.payment_method === 'Cash on Delivery');
      if (!codExists) {
        methods.unshift({ payment_id: 'cod', payment_method: 'Cash on Delivery', payment_credential: {} });
      } else {
        const codIndex = methods.findIndex(m => m.payment_method === 'Cash on Delivery');
        const codItem = methods.splice(codIndex, 1)[0];
        methods.unshift(codItem);
      }

      setPaymentMethods(methods);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not fetch payment methods.');
    }
  };

  useEffect(() => {
    fetchCart();
    fetchAddresses();
    fetchPaymentMethods();
  }, []);

  const placeOrder = async () => {

    if (!selectedAddress) { Alert.alert('Error', 'Please select an address.'); return; }
    if (!selectedPayment) { Alert.alert('Error', 'Please select a payment method.'); return; }
    if (tip < 0) { Alert.alert('Error', 'Tip cannot be negative.'); return; }

    setPlacingOrder(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      // Place order
      const response = await fetch(`${portLink()}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: userId,
          items: cartItems,
          total: totalAmount + tip,
          status: 'pending',
          address_id: selectedAddress.id,
          payment_id: selectedPayment.payment_id,
          tip,
        }),
      });

      if (!response.ok) throw new Error('Failed to place order');
      const data = await response.json();
      Alert.alert('Success', `Order placed!`);

      // Delete cart items after successful order
      const deleteResponse = await fetch(`${portLink()}/cart/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!deleteResponse.ok) console.warn('Failed to clear cart');
      else {
        setCartItems([]);
        setTotalAmount(0);
      }

      navigation.navigate('BuyerHomePage');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not place order. Please try again.');
    } finally { setPlacingOrder(false); }
  };

  // Format Payment Display
  const formatPaymentDisplay = (payment) => {
    if (!payment) return '';
    if (payment.payment_method === 'Cash on Delivery') return 'Cash on Delivery';

    if (payment.payment_method.toLowerCase() === 'bkash') {
      const num = payment.payment_credential?.bkash_number || '';
      if (num.length > 6) return `bKash: ${num.slice(0, 3)}***${num.slice(-3)}`;
      return `bKash: ${num}`;
    }

    if (payment.payment_method.toLowerCase() === 'card') {
      const num = payment.payment_credential?.card_number || '';
      if (num.length > 6) return `Card: ${num.slice(0, 3)}***${num.slice(-3)}`;
      return `Card: ${num}`;
    }

    return payment.payment_method;
  };

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Checkout</Text>

        {loading ? (
          <Text style={{ color: '#ccc', marginTop: 20 }}>Loading...</Text>
        ) : cartItems.length === 0 ? (
          <Text style={{ color: '#ccc', marginTop: 20 }}>Your cart is empty.</Text>
        ) : (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemPrice}>
                    ৳{((item.product_price - item.discount * 0.01 * item.product_price) * item.quantity).toFixed(2)}
                  </Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />

            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <TouchableOpacity style={styles.selectorButton} onPress={() => setAddressModalVisible(true)}>
              <Text style={styles.selectorText}>
                {selectedAddress ? `${selectedAddress.road}, Building ${selectedAddress.building_no}, Floor ${selectedAddress.floor_num}, Apt ${selectedAddress.apartment_no}` : 'Select Address'}
              </Text>
            </TouchableOpacity>

            <Modal visible={addressModalVisible} animationType="slide" transparent={true}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Address</Text>
                  <ScrollView>
                    {addresses.length === 0 ? (
                      <Text style={{ color: '#ccc', marginVertical: 10 }}>No addresses available</Text>
                    ) : addresses.map((addr, idx) => (
                      <TouchableOpacity key={idx} onPress={() => { setSelectedAddress(addr); setAddressModalVisible(false); }} style={styles.addressCard}>
                        <Text style={styles.cardTitle}>{addr.road}</Text>
                        <Text style={styles.cardText}>Building: {addr.building_no}</Text>
                        <Text style={styles.cardText}>Floor: {addr.floor_num}</Text>
                        <Text style={styles.cardText}>Apartment: {addr.apartment_no}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={styles.modalClose}>
                    <Text style={{ color: '#fff' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View style={styles.tipContainer}>
              <Text style={{ color: '#fff', marginBottom: 5 }}>Tip Amount:</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="Enter tip amount"
                placeholderTextColor="#ccc"
                style={styles.tipInput}
                value={tip.toString()}
                onChangeText={val => setTip(Number(val))}
              />
            </View>

            <Text style={styles.fieldLabel}>Payment Method</Text>
            <TouchableOpacity style={styles.selectorButton} onPress={() => setPaymentModalVisible(true)}>
              <Text style={styles.selectorText}>{formatPaymentDisplay(selectedPayment)}</Text>
            </TouchableOpacity>

            <Modal visible={paymentModalVisible} animationType="slide" transparent={true}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Payment Method</Text>
                  <ScrollView>
                    {paymentMethods.map((pay, idx) => (
                      <TouchableOpacity key={idx} onPress={() => { setSelectedPayment(pay); setPaymentModalVisible(false); }} style={styles.addressCard}>
                        <Text style={styles.cardTitle}>{formatPaymentDisplay(pay)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.modalClose}>
                    <Text style={{ color: '#fff' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Text style={styles.total}>Total: ৳{(totalAmount + (tip || 0)).toFixed(2)}</Text>

            <TouchableOpacity style={styles.button} onPress={placeOrder} disabled={placingOrder || !selectedAddress || !selectedPayment}>
              <LinearGradient colors={placingOrder || !selectedAddress || !selectedPayment ? ['#555', '#777'] : ['#3a6b35', '#2c4f25']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>{placingOrder ? 'Placing Order...' : 'Place Order'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
              <LinearGradient colors={['#6b0f1a', '#b9131b']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  itemPrice: { fontSize: 14, color: '#fff', marginTop: 4 },
  itemQuantity: { fontSize: 14, color: '#fff', marginTop: 2 },
  selectorButton: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 10, marginBottom: 12 },
  selectorText: { color: '#fff' },
  fieldLabel: { color: '#fff', fontWeight: 'bold', marginBottom: 5, fontSize: 14 },
  tipContainer: { marginBottom: 12 },
  tipInput: { borderWidth: 1, borderColor: '#fff', borderRadius: 8, padding: 8, color: '#fff' },
  total: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'right', marginTop: 10 },
  button: { width: '100%', borderRadius: 10, marginTop: 20 },
  buttonGradient: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#203a43', width: '80%', maxHeight: '70%', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  addressCard: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 10, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  cardText: { color: '#fff', fontSize: 14, marginBottom: 2 },
  modalClose: { marginTop: 10, backgroundColor: '#3a6b35', padding: 10, borderRadius: 8, alignItems: 'center' },
});
