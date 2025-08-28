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

      const cartRes = await fetch(`${portLink()}/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!cartRes.ok) throw new Error('Failed to fetch cart');
      const cartData = await cartRes.json();

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
        body: JSON.stringify({ quantity: 0 }),
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
            <Ionicons name="remove-circle-outline" size={24} color="#D96F32" />
          </TouchableOpacity>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.product_id, item.quantity + 1)}>
            <Ionicons name="add-circle-outline" size={24} color="#D96F32" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.product_id)}>
        <Ionicons name="trash-outline" size={24} color="#C75D2C" />
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Cart</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : cartItems.length === 0 ? (
          <Text style={styles.emptyText}>Your cart is empty.</Text>
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

        {/* Only show checkout button if cart has items */}
        {cartItems.length > 0 && (
          <TouchableOpacity
            style={[styles.button, { marginTop: 10 }]}
            onPress={() => navigation.navigate('Checkout')}
          >
            <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Checkout</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
          <LinearGradient colors={['#C75D2C', '#A0562B']} style={styles.buttonGradient}>
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
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#5D2A1A', 
    marginBottom: 20, 
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: '100%',
    shadowColor: '#D96F32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(217, 111, 50, 0.2)',
  },
  itemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  itemName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#5D2A1A',
    marginBottom: 4,
  },
  itemPrice: { 
    fontSize: 14, 
    color: '#8B4513', 
    marginTop: 4,
    fontWeight: '600',
  },
  itemPriceLine: { 
    fontSize: 14, 
    color: '#8B4513', 
    marginTop: 4, 
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  itemPriceDiscounted: { 
    fontSize: 14, 
    color: '#C75D2C', 
    marginTop: 2,
    fontWeight: 'bold',
  },
  quantityContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8,
    backgroundColor: 'rgba(217, 111, 50, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemQuantity: { 
    fontSize: 16, 
    color: '#5D2A1A', 
    marginHorizontal: 15,
    fontWeight: 'bold',
  },
  total: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#5D2A1A', 
    textAlign: 'right', 
    marginTop: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 12,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  button: { 
    width: '100%', 
    borderRadius: 14, 
    marginTop: 20,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonGradient: { 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center',
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingText: {
    color: '#8B4513',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
  },
  emptyText: {
    color: '#8B4513',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
  },
});