import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation'; // Your server link

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        if (!token || !userId) return;

        const response = await fetch(`${portLink()}/orders/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data); // Already sorted client-side
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Text style={styles.itemName}>{item.product_name}</Text>
      <Text style={styles.itemPrice}>৳{item.item_total?.toFixed(2) || 0}</Text>
      <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
    </View>
  );

  const renderOrder = ({ item }) => {
    const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return (
      <View style={styles.card}>
        <Text style={styles.orderTitle}>Order Date: {formattedDate}</Text>
        <FlatList
          data={item.items}
          keyExtractor={(i, idx) => idx.toString()}
          renderItem={renderOrderItem}
        />
        <View style={styles.statusTotalContainer}>
          <Text style={styles.itemStatus}>{item.status || 'Pending'}</Text>
          <Text style={styles.total}>Total: ৳{item.total?.toFixed(2) || 0}</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Order Tracking</Text>

        {loading ? (
          <Text style={{ color: '#ccc', marginTop: 20 }}>Loading...</Text>
        ) : orders.length === 0 ? (
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  orderTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  orderItem: {
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  itemPrice: { fontSize: 12, color: '#fff', marginTop: 2 },
  itemQuantity: { fontSize: 12, color: '#fff', marginTop: 2 },
  itemStatus: { fontSize: 14, fontWeight: 'bold', color: '#fff', textAlign: 'left' },
  total: { fontSize: 14, fontWeight: 'bold', color: '#fff', textAlign: 'right' },
  statusTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
});
