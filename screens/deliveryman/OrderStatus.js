import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import {portLink} from '../../navigation/AppNavigation'

export default function OrderStatus() {
  const [status, setStatus] = useState('Pending');

  const updateStatus = (newStatus) => {
    setStatus(newStatus);
    Alert.alert('Status Updated', `Order is now ${newStatus}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status</Text>
      <Text>Current Status: {status}</Text>
      <View style={styles.btnGroup}>
        <Button title="Picked Up" onPress={() => updateStatus('Picked Up')} />
        <Button title="Delivered" onPress={() => updateStatus('Delivered')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  btnGroup: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }
});
