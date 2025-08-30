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
    <LinearGradient colors={['#F3E9DC', '#F8B259']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.address}>{order.address}</Text>
          <Text style={styles.status}>Status: {status}</Text>

          {!assigned && (
            <TouchableOpacity onPress={handleSelectOrder} style={styles.buttonWrapper}>
              <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.button}>
                <Text style={styles.buttonText}>Select Order</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {assigned && status === 'Assigned to you' && (
            <TouchableOpacity onPress={handlePickup} style={styles.buttonWrapper}>
              <LinearGradient colors={['#F8B259', '#D96F32']} style={styles.button}>
                <Text style={styles.buttonText}>Mark as Picked Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {assigned && status === 'Picked Up' && (
            <TouchableOpacity onPress={handleDelivery} style={styles.buttonWrapper}>
              <LinearGradient colors={['#C75D2C', '#D96F32']} style={styles.button}>
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
  container: { 
    flex: 1 
  },
  scroll: { 
    padding: 20 
  },
  card: {
    backgroundColor: 'rgba(215, 111, 50, 0.1)',
    borderRadius: 18,
    padding: 28,
    shadowColor: '#C75D2C',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.2)',
  },
  customerName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#C75D2C',
    marginBottom: 12,
    textAlign: 'center',
  },
  address: {
    fontSize: 17,
    color: '#D96F32',
    marginBottom: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  status: {
    fontSize: 16,
    color: '#C75D2C',
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: 'rgba(243, 233, 220, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  buttonWrapper: {
    marginTop: 15,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#C75D2C',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  buttonText: {
    color: '#F3E9DC',
    fontWeight: 'bold',
    fontSize: 17,
  },
});