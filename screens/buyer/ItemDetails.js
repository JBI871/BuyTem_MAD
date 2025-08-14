import React, { useState } from 'react';
import { Image, View, Text, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {portLink} from '../../navigation/AppNavigation'

export default function ItemDetails({ route, navigation }) {
  const { item } = route.params;
  <Image source={item.image} style={{ width: 200, height: 200 }} />

  const addToCart = async () => {
    try {
      const cartJSON = await AsyncStorage.getItem('cart');
      const cart = cartJSON ? JSON.parse(cartJSON) : [];
      cart.push(item);
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      Alert.alert('Success', `${item.name} added to cart`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent:'center', alignItems:'center', padding: 20 }}>
        <Image
  source={require('../../assets/400x400.png')
 }
  style={{ width: 200, height: 200, marginBottom: 20 }}
/>
      <Text style={{ fontSize: 20 }}>{item.name}</Text>
      <Text>Price: ${item.price}</Text>

      <Button title="Add to Cart" onPress={addToCart} />
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}
