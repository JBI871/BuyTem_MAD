import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {portLink} from '../../navigation/AppNavigation'

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

  return (
    <View style={{ flex:1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Order Tracking</Text>

      {orders.length === 0 ? (
        <Text>No orders placed yet.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Text>{item.name} - ${item.price} - Status: Pending</Text>
          )}
        />
      )}
    </View>
  );
}
