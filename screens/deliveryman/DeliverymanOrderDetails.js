import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import {portLink} from '../../navigation/AppNavigation'

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
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        {order.customerName}
      </Text>
      <Text style={{ marginVertical: 5 }}>{order.address}</Text>
      <Text style={{ marginVertical: 5 }}>Status: {status}</Text>

      {/* If not assigned, show option to select order */}
      {!assigned && (
        <Button title="Select Order" onPress={handleSelectOrder} />
      )}

      {/* If assigned, show status update buttons */}
      {assigned && status === 'Assigned to you' && (
        <Button title="Mark as Picked Up" onPress={handlePickup} />
      )}
      {assigned && status === 'Picked Up' && (
        <Button title="Mark as Delivered" onPress={handleDelivery} />
      )}
    </View>
  );
}
