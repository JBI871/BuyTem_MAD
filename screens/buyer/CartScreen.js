import React, { useEffect, useState } from 'react';
import { Image, View, Text, Button, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  return (
    <View style={{ flex:1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Cart</Text>

      {cartItems.length === 0 ? (
        <Text>Your cart is empty.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <Image
        source={item.image ? item.image : require('../../assets/400x400.png')} 
        style={{ width: 40, height: 40, marginRight: 10 }}
      />
      <Text>{item.name} - ${item.price}</Text>
    </View>
          )}
        />
      )}

      <Button title="Checkout" onPress={checkout} />
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}
