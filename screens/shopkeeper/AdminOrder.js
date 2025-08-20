import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

export default function AdminOrder() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  // Fetch all products and store in a dictionary
  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${portLink()}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const prodMap = {};
      data.forEach(p => (prodMap[p.id] = p));
      setProducts(prodMap);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${portLink()}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update order status and decrease stock if accepted
  const updateOrderStatus = async (orderId, status, items) => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Decrease stock if accepting
      if (status === 'Accepted') {
        for (let item of items) {
          const product = products[item.product_id];
          if (!product) continue;

          const newQuantity = (product.quantity || 0) - item.quantity;

          await fetch(`${portLink()}/products/update/${item.product_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ quantity: newQuantity >= 0 ? newQuantity : 0 }),
          });
        }
      }

      // Update order status
      const response = await fetch(`${portLink()}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update order');

      Alert.alert('Success', `Order ${status}`);
      fetchProducts(); // Refresh product stock
      fetchOrders();   // Refresh orders
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const renderOrderItem = ({ item, orderStatus }) => {
    const availableQty = orderStatus === 'pending' ? products[item.product_id]?.quantity || 0 : null;

    return (
      <View style={styles.orderItem}>
        <Text style={styles.itemName}>{item.product_name}</Text>
        <Text style={styles.itemPrice}>৳{item.item_total?.toFixed(2) || 0}</Text>
        <Text style={styles.itemQuantity}>Ordered: {item.quantity}</Text>
        {orderStatus === 'pending' && (
          <Text style={styles.itemQuantity}>Available: {availableQty}</Text>
        )}
      </View>
    );
  };

  const renderOrder = ({ item }) => {
    const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });

    const cannotAccept = item.status === 'pending' && item.items.some(i => {
      const product = products[i.product_id];
      return i.quantity > (product?.quantity || 0);
    });

    return (
      <View style={styles.card}>
        <Text style={styles.orderTitle}>Order Date: {formattedDate}</Text>
        <FlatList
          data={item.items}
          keyExtractor={(i, idx) => idx.toString()}
          renderItem={({ item: orderItem }) => renderOrderItem({ item: orderItem, orderStatus: item.status })}
        />

        <View style={styles.statusTotalContainer}>
          <Text style={styles.itemStatus}>{item.status}</Text>
          <Text style={styles.total}>Total: ৳{item.total?.toFixed(2) || 0}</Text>
        </View>

        {cannotAccept && (
          <Text style={{ color: 'yellow', marginTop: 5, textAlign: 'center' }}>
            Some items have insufficient stock
          </Text>
        )}

        {item.status === 'pending' && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: cannotAccept ? 'gray' : 'green' }]}
              onPress={() => !cannotAccept && updateOrderStatus(item.order_id, 'Accepted', item.items)}
              disabled={cannotAccept}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'red' }]}
              onPress={() => updateOrderStatus(item.order_id, 'Denied', item.items)}
            >
              <Text style={styles.buttonText}>Deny</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>All Orders</Text>

        {loading ? (
          <Text style={{ color: '#ccc', marginTop: 20 }}>Loading...</Text>
        ) : orders.length === 0 ? (
          <Text style={{ color: '#ccc', marginTop: 20 }}>No orders yet.</Text>
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
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, marginBottom: 20 },
  orderTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  orderItem: { flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 10, marginBottom: 8 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  itemPrice: { fontSize: 12, color: '#fff', marginTop: 2 },
  itemQuantity: { fontSize: 12, color: '#fff', marginTop: 2 },
  itemStatus: { fontSize: 14, fontWeight: 'bold', color: '#fff', textAlign: 'left' },
  total: { fontSize: 14, fontWeight: 'bold', color: '#fff', textAlign: 'right' },
  statusTotalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  button: { flex: 1, padding: 10, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
