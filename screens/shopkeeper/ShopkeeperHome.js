import React from 'react';
import { View, Text, Button } from 'react-native';
import {portLink} from '../../navigation/AppNavigation'

export default function ShopkeeperHome({ navigation, setUserRole }) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text>Shopkeeper Home</Text>
      <Button title="Inventory" onPress={() => navigation.navigate('Inventory')} />
      <Button title="Manage Deliverymen" onPress={() => navigation.navigate('ManageDeliverymen')} />
      <Button title="Shop Policies" onPress={() => navigation.navigate('ShopPolicies')} />
      <Button title="Logout" onPress={() => setUserRole(null)} />
    </View>
  );
}
