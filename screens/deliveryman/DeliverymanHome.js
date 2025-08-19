import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../../navigation/AppNavigation';

export default function DeliverymanHome({ navigation, setUserRole }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState(null); // free or busy

  useEffect(() => {
    checkUserStatus();
  }, []);

  // Check deliveryman status
  const checkUserStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch(`${portLink()}/users/by_id/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setStatus(data.status || 'free');

      if (data.status === 'busy') {
        navigation.replace('CurrentDelivery'); // redirect if busy
      } else {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch user status');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${portLink()}/orders/status/Accepted`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const ordersArray = data.orders || [];

      const ordersWithInfo = await Promise.all(
        ordersArray.map(async (order) => {
          const customerRes = await fetch(`${portLink()}/users/by_id/${order.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const customerData = await customerRes.json();

          const addressRes = await fetch(`${portLink()}/addresses/user/${order.user_id}/${order.address_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const addressData = await addressRes.json();

          return {
            ...order,
            customerName: customerData.name,
            customerEmail: customerData.email,
            customerPhone: customerData.phone,
            addressDetails: addressData,
          };
        })
      );

      setOrders(ordersWithInfo);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = (order) => setSelectedOrder(order);

  const acceptOrder = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');

    // 1️⃣ Update order status
    const orderRes = await fetch(`${portLink()}/orders/${selectedOrder.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Picked Up', deliveryManId: userId }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.error || 'Failed to update order');

    // 2️⃣ Update deliveryman status
    const userRes = await fetch(`${portLink()}/users/${userId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'busy' }),
    });
    const userData = await userRes.json();
    if (!userRes.ok) throw new Error(userData.error || 'Failed to update user status');

    // 3️⃣ Create delivery confirmation
    const confirmRes = await fetch(`${portLink()}/confirmDelivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: selectedOrder.id,
        deliveryManId: userId,
        customerId: selectedOrder.user_id, 
      }),
    });
    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) throw new Error(confirmData.error || 'Failed to create delivery confirmation');

    Alert.alert(
      'Success',
    );

    setModalVisible(false);
    navigation.replace('CurrentDelivery');

  } catch (err) {
    console.error(err);
    Alert.alert('Error', err.message);
  }
};


  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedOrder(item) || setModalVisible(true)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.customerName}>Order Date: {new Date(item.createdAt).toLocaleString()}</Text>
        <Text style={styles.status}>Total: ৳{item.total?.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userId');
    setUserRole(null);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  if (status === null) return <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />;

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <Text style={styles.title}>Pending Orders</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
      ) : orders.length === 0 ? (
        <Text style={{ color: '#ccc', marginTop: 20 }}>No pending orders.</Text>
      ) : (
        <FlatList data={orders} keyExtractor={(item) => item.id} renderItem={renderOrder} contentContainerStyle={{ paddingBottom: 20 }} />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <Text style={styles.modalTitle}>Customer Info</Text>
                <Text>Name: {selectedOrder.customerName}</Text>
                <Text>Email: {selectedOrder.customerEmail}</Text>
                <Text>Phone: {selectedOrder.customerPhone}</Text>

                <Text style={[styles.modalTitle, { marginTop: 10 }]}>Address</Text>
                <Text>Apartment: {selectedOrder.addressDetails.apartment_no}</Text>
                <Text>Building: {selectedOrder.addressDetails.building_no}</Text>
                <Text>Floor: {selectedOrder.addressDetails.floor_num}</Text>
                <Text>Road: {selectedOrder.addressDetails.road}</Text>

                <Pressable style={styles.acceptButton} onPress={acceptOrder}>
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </Pressable>
                <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Navigation Buttons */}
      <TouchableOpacity onPress={() => navigation.navigate('OrderStatus')} style={{ marginTop: 20 }}>
        <LinearGradient colors={['#f3d009ff', '#ff9900ff']} style={styles.button}>
          <Text style={styles.buttonText}>Order Status</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('DeliverymanProfile')} style={{ marginTop: 20 }}>
        <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
          <Text style={styles.buttonText}>Profile</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={{ marginTop: 10 }}>
        <LinearGradient colors={['#7a1f1f', '#4d0f0f']} style={styles.button}>
          <Text style={styles.buttonText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  orderCard: { flexDirection: 'row', padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  customerName: { fontWeight: 'bold', color: '#fff', fontSize: 16 },
  status: { color: '#aaa', fontSize: 14, marginTop: 2 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  acceptButton: { marginTop: 15, backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center' },
  acceptButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeButton: { marginTop: 10, backgroundColor: '#ff3333', padding: 10, borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontWeight: 'bold' },
});
