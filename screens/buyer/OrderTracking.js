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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#F8B259';
      case 'confirmed': return '#D96F32';
      case 'picked up': return '#C75D2C';
      case 'delivered': return '#2ecc71';
      case 'cancelled': return '#e74c3c';
      default: return '#F8B259';
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Text style={styles.itemName}>{item.product_name}</Text>
      <View style={styles.itemRow}>
        <Text style={styles.itemPrice}>৳{item.item_total?.toFixed(2) || 0}</Text>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>
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
        <View style={styles.orderHeader}>
          <Text style={styles.orderTitle}>Order Date</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
          </View>
        </View>
        <Text style={styles.orderDate}>{formattedDate}</Text>
        
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsLabel}>Items:</Text>
          <FlatList
            data={item.items}
            keyExtractor={(i, idx) => idx.toString()}
            renderItem={renderOrderItem}
          />
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.total}>Total: ৳{item.total?.toFixed(2) || 0}</Text>
        </View>

        {item.status === 'Picked Up' && item.deliveryManId && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              setSelectedOrder(item);
              fetchDeliveryManInfo(item.deliveryManId, item.order_id);
            }}
          >
            <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.detailsButtonGradient}>
              <Text style={styles.detailsButtonText}>View Delivery Details</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Order Tracking</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#D96F32" style={styles.loadingIndicator} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders placed yet.</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderOrder}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Modal for Delivery Man Details + Confirmation Code */}
        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delivery Person Details</Text>
              {deliveryManInfo.name ? (
                <View style={styles.deliveryInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{deliveryManInfo.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{deliveryManInfo.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{deliveryManInfo.phone}</Text>
                  </View>
                  <View style={[styles.infoRow, styles.confirmationRow]}>
                    <Text style={styles.infoLabel}>Confirmation Code:</Text>
                    <Text style={styles.confirmationCode}>{deliveryManInfo.confirmationCode}</Text>
                  </View>
                </View>
              ) : (
                <ActivityIndicator size="large" color="#D96F32" style={styles.modalLoading} />
              )}
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <LinearGradient colors={['#C75D2C', '#A0562B']} style={styles.closeButtonGradient}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </LinearGradient>
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
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#5D2A1A', 
    marginBottom: 20, 
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#D96F32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(217, 111, 50, 0.2)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#5D2A1A',
  },
  orderDate: {
    fontSize: 14,
    color: '#8B4513',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  itemsContainer: {
    marginVertical: 12,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D2A1A',
    marginBottom: 8,
  },
  orderItem: {
    backgroundColor: 'rgba(217, 111, 50, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderLeft: 3,
    borderLeftColor: '#D96F32',
  },
  itemName: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#5D2A1A',
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: { 
    fontSize: 14, 
    color: '#D96F32',
    fontWeight: 'bold',
  },
  itemQuantity: { 
    fontSize: 12, 
    color: '#8B4513',
    backgroundColor: 'rgba(217, 111, 50, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  totalContainer: {
    backgroundColor: 'rgba(248, 178, 89, 0.2)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'flex-end',
    marginTop: 8,
  },
  total: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#5D2A1A',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  detailsButton: {
    marginTop: 12,
    borderRadius: 10,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsButtonGradient: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailsButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  emptyContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 16,
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8B4513',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  modalContent: { 
    width: '90%', 
    backgroundColor: '#F3E9DC', 
    borderRadius: 16, 
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#D96F32',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#5D2A1A',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  deliveryInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 111, 50, 0.2)',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D2A1A',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#8B4513',
    flex: 2,
    textAlign: 'right',
  },
  confirmationRow: {
    backgroundColor: 'rgba(248, 178, 89, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderBottomWidth: 0,
    marginTop: 8,
  },
  confirmationCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D96F32',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    textAlign: 'center',
    flex: 2,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  modalLoading: {
    marginVertical: 40,
  },
  closeButton: {
    borderRadius: 12,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  closeButtonGradient: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});