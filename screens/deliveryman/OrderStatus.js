import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

export default function OrderStatus() {
  const [status, setStatus] = useState('Pending');

  const updateStatus = (newStatus) => {
    setStatus(newStatus);
    Alert.alert('Status Updated', `Order is now ${newStatus}`);
  };

  const getStatusColor = (currentStatus) => {
    switch (currentStatus) {
      case 'Pending':
        return '#F8B259';
      case 'Picked Up':
        return '#D96F32';
      case 'Delivered':
        return '#C75D2C';
      default:
        return '#D96F32';
    }
  };

  return (
    <LinearGradient colors={['#F3E9DC', '#F8B259']} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Order Status</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Current Status:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <View style={styles.btnGroup}>
          <TouchableOpacity 
            onPress={() => updateStatus('Picked Up')} 
            style={styles.buttonWrapper}
          >
            <LinearGradient colors={['#F8B259', '#D96F32']} style={styles.button}>
              <Text style={styles.buttonText}>Picked Up</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => updateStatus('Delivered')} 
            style={styles.buttonWrapper}
          >
            <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.button}>
              <Text style={styles.buttonText}>Delivered</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    justifyContent: 'center'
  },
  card: {
    backgroundColor: 'rgba(215, 111, 50, 0.08)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#C75D2C',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.15)',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 30,
    color: '#C75D2C',
    textAlign: 'center'
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(243, 233, 220, 0.4)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.1)',
  },
  statusLabel: {
    fontSize: 18,
    color: '#D96F32',
    marginBottom: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#C75D2C',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3E9DC',
    textAlign: 'center',
  },
  btnGroup: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 15
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#C75D2C',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  buttonText: {
    color: '#F3E9DC',
    fontWeight: 'bold',
    fontSize: 16,
  },
});