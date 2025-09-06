import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ScrollView, Modal, TextInput, Image } from 'react-native';
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

      // Fetch cart items
      const cartRes = await fetch(`${portLink()}/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!cartRes.ok) throw new Error('Failed to fetch cart');
      const cartData = await cartRes.json();

      // Fetch product info for each cart item
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
            imageUrl: product.imageUrl || '', // make sure backend returns this field
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

      // Ensure COD exists
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
      Alert.alert('Success', `Order placed!`);

      // Clear cart
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
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Checkout</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : cartItems.length === 0 ? (
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        ) : (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => {
                const finalPrice = (item.product_price - item.discount * 0.01 * item.product_price) * item.quantity;

                return (
                  <View style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Image
                      source={{ uri: `${portLink()}${item.imageUrl}` }}
                      style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      <Text style={styles.itemPrice}>৳{finalPrice.toFixed(2)}</Text>
                      <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    </View>
                  </View>
                );
              }}
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
                      <Text style={styles.modalEmptyText}>No addresses available</Text>
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
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View style={styles.tipContainer}>
              <Text style={styles.tipLabel}>Tip Amount:</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="Enter tip amount"
                placeholderTextColor="#8B4513"
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
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Text style={styles.total}>Total: ৳{(totalAmount + (tip || 0)).toFixed(2)}</Text>

            <TouchableOpacity style={styles.button} onPress={placeOrder} disabled={placingOrder || !selectedAddress || !selectedPayment}>
              <LinearGradient colors={placingOrder || !selectedAddress || !selectedPayment ? ['#A0A0A0', '#808080'] : ['#D96F32', '#C75D2C']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>{placingOrder ? 'Placing Order...' : 'Place Order'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
              <LinearGradient colors={['#C75D2C', '#A0562B']} style={styles.buttonGradient}>
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
  title: { 
    fontSize: 28, fontWeight: 'bold', color: '#5D2A1A', marginBottom: 20, textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
  },
  card: { 
    backgroundColor: 'rgba(255,255,255,0.9)', padding: 16, borderRadius: 16, marginBottom: 12,
    shadowColor: '#D96F32', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(217, 111, 50, 0.2)',
  },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#5D2A1A', marginBottom: 4 },
  itemPrice: { fontSize: 14, color: '#D96F32', marginTop: 4, fontWeight: '600' },
  itemQuantity: { fontSize: 14, color: '#8B4513', marginTop: 2 },
  selectorButton: { 
    backgroundColor: 'rgba(255,255,255,0.9)', padding: 14, borderRadius: 12, marginBottom: 15,
    borderWidth: 1, borderColor: 'rgba(217, 111, 50, 0.3)',
    shadowColor: '#D96F32', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  selectorText: { color: '#5D2A1A', fontSize: 15, fontWeight: '500' },
  fieldLabel: { color: '#5D2A1A', fontWeight: 'bold', marginBottom: 8, fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
  tipContainer: { marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.9)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(217, 111, 50, 0.2)' },
  tipLabel: { color: '#5D2A1A', fontWeight: 'bold', marginBottom: 8, fontSize: 16 },
  tipInput: { borderWidth: 2, borderColor: '#D96F32', borderRadius: 10, padding: 12, color: '#5D2A1A', backgroundColor: '#fff', fontSize: 15 },
  total: { fontSize: 20, fontWeight: 'bold', color: '#5D2A1A', textAlign: 'right', marginTop: 15, backgroundColor: 'rgba(255,255,255,0.95)', padding: 14, borderRadius: 12, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, borderWidth: 2, borderColor: '#F8B259' },
  button: { width: '100%', borderRadius: 14, marginTop: 20, shadowColor: '#C75D2C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  buttonGradient: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  loadingText: { color: '#8B4513', marginTop: 20, textAlign: 'center', fontSize: 16, fontStyle: 'italic' },
  emptyText: { color: '#8B4513', marginTop: 20, textAlign: 'center', fontSize: 16, fontStyle: 'italic' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#F3E9DC', width: '85%', maxHeight: '70%', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: '#D96F32', shadowColor: '#C75D2C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#5D2A1A', marginBottom: 15, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  addressCard: { backgroundColor: 'rgba(217, 111, 50, 0.1)', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(217, 111, 50, 0.3)' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#5D2A1A', marginBottom: 4 },
  cardText: { color: '#8B4513', fontSize: 14, marginBottom: 2 },
  modalClose: { marginTop: 15, backgroundColor: '#D96F32', padding: 12, borderRadius: 10, alignItems: 'center', shadowColor: '#C75D2C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  modalCloseText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  modalEmptyText: { color: '#8B4513', marginVertical: 10, textAlign: 'center', fontStyle: 'italic' },
});
