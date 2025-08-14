import React from 'react';
import { Image, View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import {portLink} from '../../navigation/AppNavigation'

const items = [
  { id: '1', name: 'Item 1', price: 10, image: require('../../assets/400x400.png') },
  { id: '2', name: 'Item 2', price: 20, image: require('../../assets/400x400.png') },
  { id: '3', name: 'Item 3', price: 30, image: require('../../assets/400x400.png') },
];



export default function BuyerHome({ navigation, setUserRole, userEmail }) {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Buyer Home</Text>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ padding: 10, borderBottomWidth: 1 }}
            onPress={() => navigation.navigate('ItemDetails', { item })}
          >
            <Image
  source={require('../../assets/400x400.png')} 
  style={{ width: 50, height: 50, marginRight: 10 }}
/>
            <Text>{item.name} - ${item.price}</Text>
          </TouchableOpacity>
        )}
      />

      <Button title="Profile" onPress={() => navigation.navigate('BuyerProfile', { email: userEmail })} />
      <Button title="View Cart" onPress={() => navigation.navigate('Cart')} />
      <Button title="Track Orders" onPress={() => navigation.navigate('OrderTracking')} />
      <Button title="Logout" onPress={() => setUserRole(null)} color="red" />
    </View>
  );
}
