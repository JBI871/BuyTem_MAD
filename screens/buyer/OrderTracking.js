import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Alert, ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation'; // Your server link

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [deliveryManInfo, setDeliveryManInfo] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        if (!token || !userId) return;

        const response = await fetch(`${portLink()}/orders/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
        console.log(data); // Debug log
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Fetch confirmation code by orderId
  const fetchConfirmationCode = async (orderId) => {
    console.log('Fetching confirmation code for order:', orderId);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${portLink()}/confirmDelivery/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch confirmation code');
      const data = await response.json();
      return data.confirmationCode || 'N/A';
    } catch (err) {
      console.error(err);
      return 'N/A';
    }
  };

  // Fetch delivery man info + confirmation code
  const fetchDeliveryManInfo = async (deliveryManId, orderId) => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Fetch delivery man info
      const userRes = await fetch(`${portLink()}/users/by_id/${deliveryManId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) throw new Error('Failed to fetch delivery man info');
      const userData = await userRes.json();

      // Fetch confirmation code
      const code = await fetchConfirmationCode(orderId);

      setDeliveryManInfo({ ...userData, confirmationCode: code });
      setModalVisible(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch delivery man details');
    }
  };

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

        {item.status === 'Picked Up' && item.deliveryManId && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              setSelectedOrder(item);
              fetchDeliveryManInfo(item.deliveryManId, item.order_id); // <-- FIXED here
            }}
          >
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Order Tracking</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
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

        {/* Modal for Delivery Man Details + Confirmation Code */}
        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delivery Man Details</Text>
              {deliveryManInfo.name ? (
                <>
                  <Text>Name: {deliveryManInfo.name}</Text>
                  <Text>Email: {deliveryManInfo.email}</Text>
                  <Text>Phone: {deliveryManInfo.phone}</Text>
                  <Text style={{ marginTop: 5, fontWeight: 'bold' }}>
                    Confirmation Code: {deliveryManInfo.confirmationCode}
                  </Text>
                </>
              ) : (
                <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
              )}
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  detailsButton: {
    marginTop: 10,
    backgroundColor: '#28a745',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  closeButton: { marginTop: 15, backgroundColor: '#ff3333', padding: 10, borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontWeight: 'bold' },
});
