import React from 'react';
import { View, Text, Button } from 'react-native';

export default function BuyerHome({ navigation, setUserRole }) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text>Buyer Home</Text>
      <Button title="Go to Cart" onPress={() => navigation.navigate('Cart')} />
      <Button title="View Item Details" onPress={() => navigation.navigate('ItemDetails')} />
      <Button title="Track Orders" onPress={() => navigation.navigate('OrderTracking')} />
      <Button title="Logout" onPress={() => setUserRole(null)} />
    </View>
  );
}
