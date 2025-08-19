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
        <Text>Total: ৳{item.total?.toFixed(2)}</Text>
        <Text>Tip: ৳{item.tip}</Text>
        <Text>Status: {item.status}</Text>

        <Text style={{ marginTop: 5, fontWeight: 'bold' }}>Items:</Text>
        {item.items.map((i, index) => (
          <Text key={index}>
            {i.product_name} x{i.quantity} = ৳{i.item_total}
          </Text>
        ))}

        <Text style={{ marginTop: 5, fontWeight: 'bold' }}>User Info:</Text>
        <Text>Name: {user.name || 'Loading...'}</Text>
        <Text>Email: {user.email || 'Loading...'}</Text>
        <Text>Phone: {user.phone || 'Loading...'}</Text>

        <Text style={{ marginTop: 5, fontWeight: 'bold' }}>Address Info:</Text>
        <Text>Apartment: {address.apartment_no || 'Loading...'}</Text>
        <Text>Building: {address.building_no || 'Loading...'}</Text>
        <Text>Floor: {address.floor_num || 'Loading...'}</Text>
        <Text>Road: {address.road || 'Loading...'}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter confirmation code"
          keyboardType="numeric"
          value={confirmationCodesMap[item.id] || ''}
          onChangeText={(text) =>
            setConfirmationCodesMap((prev) => ({ ...prev, [item.id]: text }))
          }
        />

        <TouchableOpacity onPress={() => confirmDelivery(item)} style={{ marginTop: 10 }}>
          <LinearGradient colors={['#7a1f1f', '#4d0f0f']} style={styles.button}>
            <Text style={styles.buttonText}>Confirm Delivery</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading)
    return <ActivityIndicator size="large" color="#7a1f1f" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Delivery</Text>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <Text style={{ marginTop: 50, fontSize: 18, textAlign: 'center' }}>
          No current orders.
        </Text>
      )}

      <TouchableOpacity onPress={handleLogout} style={{ marginTop: 20 }}>
        <LinearGradient colors={['#7a1f1f', '#4d0f0f']} style={styles.button}>
          <Text style={styles.buttonText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 20 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  orderCard: { padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginTop: 10 },
});
