import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const ordersJSON = await AsyncStorage.getItem('orders');
      const ordersList = ordersJSON ? JSON.parse(ordersJSON) : [];
      setOrders(ordersList);
    };
    fetchOrders();
  }, []);

  const renderOrder = ({ item, index }) => (
    <View style={styles.card}>
      <Ionicons name="cart-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price}</Text>
        <Text style={styles.itemStatus}>Status: Pending</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Order Tracking</Text>

        {orders.length === 0 ? (
          <Text style={{ color: '#ccc', marginTop: 20 }}>No orders placed yet.</Text>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderOrder}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
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
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  itemPrice: { fontSize: 14, color: '#fff', marginTop: 4 },
  itemStatus: { fontSize: 12, color: '#ccc', marginTop: 2 },
});
