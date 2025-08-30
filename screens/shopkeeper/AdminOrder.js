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
          <Text style={styles.insufficientStock}>
            Some items have insufficient stock
          </Text>
        )}

        {item.status === 'pending' && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.acceptButton, { opacity: cannotAccept ? 0.5 : 1 }]}
              onPress={() => !cannotAccept && updateOrderStatus(item.order_id, 'Accepted', item.items)}
              disabled={cannotAccept}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.denyButton}
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
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>All Orders</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : orders.length === 0 ? (
          <Text style={styles.emptyText}>No orders yet.</Text>
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
  container: { 
    flex: 1 
  },
  scroll: { 
    padding: 20 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#C75D2C', 
    marginBottom: 20, 
    textAlign: 'center',
    textShadowColor: 'rgba(199, 93, 44, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  card: { 
    backgroundColor: 'rgba(243, 233, 220, 0.95)', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 16,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(199, 93, 44, 0.2)',
  },
  orderTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#C75D2C', 
    marginBottom: 12,
    textAlign: 'center',
  },
  orderItem: { 
    flexDirection: 'column', 
    backgroundColor: 'rgba(248, 178, 89, 0.3)', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 111, 50, 0.3)',
  },
  itemName: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#C75D2C',
    marginBottom: 4,
  },
  itemPrice: { 
    fontSize: 13, 
    color: '#D96F32', 
    fontWeight: '600',
  },
  itemQuantity: { 
    fontSize: 12, 
    color: '#C75D2C', 
    marginTop: 2,
    opacity: 0.8,
  },
  itemStatus: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#C75D2C', 
    textAlign: 'left',
    backgroundColor: 'rgba(248, 178, 89, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  total: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#D96F32', 
    textAlign: 'right',
  },
  statusTotalContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(199, 93, 44, 0.2)',
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 16,
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#D96F32',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  denyButton: {
    flex: 1,
    backgroundColor: '#C75D2C',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: { 
    color: '#F3E9DC', 
    fontWeight: 'bold', 
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  insufficientStock: {
    color: '#C75D2C',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: 'rgba(248, 178, 89, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 13,
  },
  loadingText: {
    color: '#C75D2C',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  emptyText: {
    color: '#D96F32',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
});