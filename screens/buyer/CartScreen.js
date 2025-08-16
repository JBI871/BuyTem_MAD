import React, { useEffect, useState } from 'react';
import { Image, View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { portLink } from '../../navigation/AppNavigation';

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch cart items
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

      const response = await fetch(`${portLink()}/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch cart');

      const data = await response.json();
      setCartItems(data.items);
      setTotalAmount(data.total);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not fetch cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update item quantity
  const updateQuantity = async (productId, newQuantity) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch(`${portLink()}/cart/${userId}/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) throw new Error('Failed to update quantity');

      // Refresh cart after update
      fetchCart();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not update quantity');
    }
  };

  // Remove item from cart
  const removeItem = async (productId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch(`${portLink()}/cart/${userId}/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: 0 }), // quantity 0 triggers removal
      });

      if (!response.ok) throw new Error('Failed to remove item');

      fetchCart();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not remove item');
    }
  };

  // Render cart item
  const renderCartItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.product_name}</Text>
        {item.discount > 0 ? (
          <>
            <Text style={styles.itemPriceLine}>৳{item.product_price.toFixed(2)}</Text>
            <Text style={styles.itemPriceDiscounted}>
              ৳{(item.product_price - item.discount * 0.01 * item.product_price).toFixed(2)}
            </Text>
          </>
        ) : (
          <Text style={styles.itemPrice}>৳{item.product_price.toFixed(2)}</Text>
        )}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => item.quantity > 1 && updateQuantity(item.product_id, item.quantity - 1)}
          >
            <Ionicons name="remove-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.product_id, item.quantity + 1)}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.product_id)}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Cart</Text>

        {loading ? (
          <Text style={{ color: '#ccc', marginTop: 20 }}>Loading...</Text>
        ) : cartItems.length === 0 ? (
          <Text style={{ color: '#ccc', marginTop: 20 }}>Your cart is empty.</Text>
        ) : (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderCartItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
            <Text style={styles.total}>Total: ৳{totalAmount.toFixed(2)}</Text>
          </>
        )}

        <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
          <LinearGradient colors={['#0d8379ff', '#02696dff']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Checkout
              
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
          <LinearGradient colors={['#6b0f1a', '#b9131b']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    width: '100%',
  },
  itemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  itemPrice: { fontSize: 14, color: '#fff', marginTop: 4 },
  itemPriceLine: { fontSize: 14, color: '#fff', marginTop: 4, textDecorationLine: 'line-through' },
  itemPriceDiscounted: { fontSize: 14, color: '#2ecc71', marginTop: 2 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  itemQuantity: { fontSize: 14, color: '#fff', marginHorizontal: 10 },
  total: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'right', marginTop: 10 },
  button: { width: '100%', borderRadius: 10, marginTop: 20 },
  buttonGradient: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
