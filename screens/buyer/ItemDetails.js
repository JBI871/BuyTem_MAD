import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ItemDetails({ route, navigation }) {
  const { item } = route.params;
  const [quantity, setQuantity] = useState(1);

  const addToCart = async () => {
    try {
      const cartJSON = await AsyncStorage.getItem('cart');
      const cart = cartJSON ? JSON.parse(cartJSON) : [];
      cart.push({ ...item, quantity });
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      Alert.alert('Success', `${item.name} (${quantity}) added to cart`);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const increment = () => setQuantity(prev => prev + 1);
  const decrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Image
            source={require('../../assets/400x400.png')}
            style={styles.image}
          />

          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price}</Text>

          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}

          {/* Quantity selector */}
          <View style={styles.quantityRow}>
            <TouchableOpacity onPress={decrement} style={styles.qtyButton}>
              <Ionicons name="remove-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity onPress={increment} style={styles.qtyButton}>
              <Ionicons name="add-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Add to Cart button */}
          <TouchableOpacity style={styles.buttonWrapper} onPress={addToCart}>
            <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
              <Text style={styles.buttonText}>Add to Cart</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Back button */}
          <TouchableOpacity style={[styles.buttonWrapper, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
            <LinearGradient colors={['#4b2c3f', '#2c1a2a']} style={styles.button}>
              <Text style={styles.buttonText}>Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, alignItems: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
  },
  image: { width: 200, height: 200, borderRadius: 10, marginBottom: 20 },
  itemName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  itemPrice: { fontSize: 18, color: '#ccc', marginBottom: 10 },
  itemDescription: { fontSize: 14, color: '#bbb', marginBottom: 15, textAlign: 'center' },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  qtyButton: {
    padding: 10,
  },
  quantityText: { color: '#fff', fontSize: 18, marginHorizontal: 20 },
  buttonWrapper: { width: '100%' },
  button: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
