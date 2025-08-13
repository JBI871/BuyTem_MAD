import React from 'react';
import { View, Text, Button } from 'react-native';

export default function DeliverymanHome({ navigation, setUserRole }) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text>Deliveryman Home</Text>
      <Button title="Order Status" onPress={() => navigation.navigate('OrderStatus')} />
      <Button title="Logout" onPress={() => setUserRole(null)} />
    </View>
  );
}
