import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

export default function CurrentDelivery({ navigation, setUserRole }) {
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfoMap, setUserInfoMap] = useState({});
  const [addressMap, setAddressMap] = useState({});
  const [confirmationCodesMap, setConfirmationCodesMap] = useState({}); // per-order codes

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedToken = await AsyncStorage.getItem('token');
        setUserId(storedUserId);
        setToken(storedToken);
      } catch (err) {
        console.error('Error fetching credentials:', err);
      }
    };
    fetchCredentials();
  }, []);

  useEffect(() => {
    if (!userId || !token) return;

    const fetchCurrentDelivery = async () => {
      try {
        const ordersRes = await fetch(`${portLink()}/orders/delivery/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!ordersRes.ok) throw new Error(`HTTP error! status: ${ordersRes.status}`);
        const ordersData = await ordersRes.json();
        const fetchedOrders = ordersData.orders || [];
        setOrders(fetchedOrders);

        const userIds = [...new Set(fetchedOrders.map(o => o.user_id))];
        const addressIds = [...new Set(fetchedOrders.map(o => o.address_id))];

        const usersResults = await Promise.all(
          userIds.map(id =>
            fetch(`${portLink()}/users/by_id/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(res => res.json())
          )
        );
        const newUserInfoMap = {};
        usersResults.forEach(user => {
          newUserInfoMap[user.id] = user;
        });
        setUserInfoMap(newUserInfoMap);

        const addressesResults = await Promise.all(
          addressIds.map(id =>
            fetch(`${portLink()}/addresses/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(res => res.json())
          )
        );
        const newAddressMap = {};
        addressesResults.forEach(addr => {
          newAddressMap[addr.id] = addr;
        });
        setAddressMap(newAddressMap);

      } catch (err) {
        console.error('Error fetching current delivery:', err);
        Alert.alert(
          'Error',
          err.message.includes('Network request failed')
            ? Platform.OS === 'android'
              ? 'Check your backend URL or use PC LAN IP / 10.0.2.2 for Android emulator.'
              : 'Check your backend URL.'
            : 'Failed to fetch current delivery'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentDelivery();
  }, [userId, token]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      setUserRole(null);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const confirmDelivery = async (order) => {
  try {
    if (!token) throw new Error('No authentication token found');

    // get confirmation code from backend
    const res = await fetch(`${portLink()}/confirmDelivery/${order.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    // compare backend code with user input
    const enteredCode = (confirmationCodesMap[order.id] || '').trim();
    const backendCode = (String(data.confirmationCode) || '').trim();

    if (backendCode === enteredCode) {
      // update order status
      const orderUpdateRes = await fetch(`${portLink()}/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'Delivered',
          deliveryManId: userId,
        }),
      });
      if (!orderUpdateRes.ok) throw new Error('Failed to update order status');

      // update delivery man status
      const userUpdateRes = await fetch(`${portLink()}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'free' }),
      });
      if (!userUpdateRes.ok) throw new Error('Failed to update user status');

      // DELETE confirmation from backend
      const deleteRes = await fetch(`${portLink()}/confirmDelivery/${order.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!deleteRes.ok) console.warn('Failed to delete confirmation code');

      Alert.alert('Success', 'Delivery confirmed successfully!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.reset({ index: 0, routes: [{ name: 'DeliverymanHome' }] }),
        },
      ]);
    } else {
      Alert.alert('Error', 'Incorrect confirmation code. Try again.');
    }
  } catch (err) {
    console.error('Error confirming delivery:', err);
    Alert.alert('Error', err.message || 'Failed to confirm delivery');
  }
};

  const renderOrder = ({ item }) => {
    const user = userInfoMap[item.user_id] || {};
    const address = addressMap[item.address_id] || {};

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderHeaderText}>Order #{item.id}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>৳{item.total?.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tip:</Text>
            <Text style={styles.summaryValueTip}>৳{item.tip}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items:</Text>
          <View style={styles.itemsContainer}>
            {item.items.map((i, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemText}>
                  {i.product_name} x{i.quantity}
                </Text>
                <Text style={styles.itemPrice}>৳{i.item_total}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Info:</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user.name || 'Loading...'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user.email || 'Loading...'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{user.phone || 'Loading...'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address:</Text>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>
              {address.road || 'Loading...'}, Building {address.building_no || 'N/A'}
            </Text>
            <Text style={styles.addressText}>
              Floor {address.floor_num || 'N/A'}, Apartment {address.apartment_no || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationLabel}>Confirmation Code:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter code from customer"
            placeholderTextColor="#8B4513"
            keyboardType="numeric"
            value={confirmationCodesMap[item.id] || ''}
            onChangeText={(text) =>
              setConfirmationCodesMap((prev) => ({ ...prev, [item.id]: text }))
            }
          />
        </View>

        <TouchableOpacity onPress={() => confirmDelivery(item)} style={styles.confirmButton}>
          <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Confirm Delivery</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D96F32" />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Current Delivery</Text>
        
        {orders.length > 0 ? (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrder}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No current orders assigned.</Text>
            <Text style={styles.emptySubText}>Check back later for new deliveries!</Text>
          </View>
        )}

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LinearGradient colors={['#C75D2C', '#A0562B']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#5D2A1A',
    fontSize: 16,
    marginTop: 10,
    fontStyle: 'italic',
  },
  emptyContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 30,
    borderRadius: 16,
    marginTop: 40,
    alignItems: 'center',
    shadowColor: '#D96F32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyText: {
    color: '#5D2A1A',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#8B4513',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  orderCard: { 
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
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 111, 50, 0.2)',
  },
  orderHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D2A1A',
  },
  statusBadge: {
    backgroundColor: '#F8B259',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5D2A1A',
  },
  orderSummary: {
    backgroundColor: 'rgba(248, 178, 89, 0.2)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#5D2A1A',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D96F32',
  },
  summaryValueTip: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C75D2C',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D2A1A',
    marginBottom: 8,
  },
  itemsContainer: {
    backgroundColor: 'rgba(217, 111, 50, 0.08)',
    borderRadius: 10,
    padding: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 111, 50, 0.1)',
  },
  itemText: {
    fontSize: 14,
    color: '#5D2A1A',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D96F32',
  },
  infoContainer: {
    backgroundColor: 'rgba(217, 111, 50, 0.05)',
    borderRadius: 10,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 111, 50, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    color: '#5D2A1A',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#8B4513',
    flex: 2,
    textAlign: 'right',
  },
  addressContainer: {
    backgroundColor: 'rgba(217, 111, 50, 0.05)',
    borderRadius: 10,
    padding: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#5D2A1A',
    lineHeight: 20,
    marginBottom: 4,
  },
  confirmationSection: {
    backgroundColor: 'rgba(248, 178, 89, 0.3)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  confirmationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D2A1A',
    marginBottom: 8,
  },
  input: { 
    borderWidth: 2, 
    borderColor: '#D96F32', 
    borderRadius: 10, 
    padding: 12, 
    color: '#5D2A1A',
    backgroundColor: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
    letterSpacing: 1,
    textAlign: 'center',
  },
  confirmButton: {
    borderRadius: 12,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutButton: {
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonGradient: { 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});