import React, { useEffect, useState } from 'react';
import { Image, View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const fetchCart = async () => {
      const cartJSON = await AsyncStorage.getItem('cart');
      const cart = cartJSON ? JSON.parse(cartJSON) : [];
      setCartItems(cart);
    };
    const unsubscribe = navigation.addListener('focus', fetchCart);
    return unsubscribe;
  }, [navigation]);

  const checkout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart is empty');
      return;
    }

    try {
      const ordersJSON = await AsyncStorage.getItem('orders');
      const orders = ordersJSON ? JSON.parse(ordersJSON) : [];
      orders.push(...cartItems);
      await AsyncStorage.setItem('orders', JSON.stringify(orders));
      await AsyncStorage.removeItem('cart');
      setCartItems([]);
      Alert.alert('Success', 'Order placed!');
    } catch (error) {
      console.log(error);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={item.image ? item.image : require('../../assets/400x400.png')}
        style={styles.itemImage}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price}</Text>
      </View>
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </View>
  );

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Cart</Text>

        {cartItems.length === 0 ? (
          <Text style={{ color: '#ccc', marginTop: 20 }}>Your cart is empty.</Text>
        ) : (
          <FlatList
            data={cartItems}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderCartItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={checkout}>
          <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Checkout</Text>
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
  button: { width: '100%', borderRadius: 10, marginTop: 20 },
  buttonGradient: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
