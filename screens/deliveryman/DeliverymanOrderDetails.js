import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

export default function DeliverymanOrderDetails({ route, navigation }) {
  const { order } = route.params;
  const [status, setStatus] = useState(order.status);
  const [assigned, setAssigned] = useState(order.assigned || false);

  const handleSelectOrder = () => {
    setAssigned(true);
    setStatus('Assigned to you');
    Alert.alert('Order Selected', 'You have been assigned this order.');
  };

  const handlePickup = () => {
    setStatus('Picked Up');
    Alert.alert('Status Updated', 'You have picked up the order.');
  };

  const handleDelivery = () => {
    setStatus('Delivered');
    Alert.alert('Status Updated', 'You have delivered the order.');
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.address}>{order.address}</Text>
          <Text style={styles.status}>Status: {status}</Text>

          {!assigned && (
            <TouchableOpacity onPress={handleSelectOrder} style={styles.buttonWrapper}>
              <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
                <Text style={styles.buttonText}>Select Order</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {assigned && status === 'Assigned to you' && (
            <TouchableOpacity onPress={handlePickup} style={styles.buttonWrapper}>
              <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
                <Text style={styles.buttonText}>Mark as Picked Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {assigned && status === 'Picked Up' && (
            <TouchableOpacity onPress={handleDelivery} style={styles.buttonWrapper}>
              <LinearGradient colors={['#7a1f1f', '#4d0f0f']} style={styles.button}>
                <Text style={styles.buttonText}>Mark as Delivered</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  address: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
  },
  buttonWrapper: {
    marginTop: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
