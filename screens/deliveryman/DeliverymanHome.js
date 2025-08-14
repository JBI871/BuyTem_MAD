import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Button } from 'react-native';
import {portLink} from '../../navigation/AppNavigation'

const orders = [
  {
    id: '1',
    customerName: 'John Doe',
    address: '123 Main Street, Cityville',
    image: require('../../assets/400x400.png'),
    status: 'Ready for Pickup'
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    address: '456 Oak Avenue, Townsville',
    image: require('../../assets/400x400.png'),
    status: 'On the Way'
  },
  {
    id: '3',
    customerName: 'Mike Johnson',
    address: '789 Pine Road, Villagetown',
    image: require('../../assets/400x400.png'),
    status: 'Delivered'
  },
];

export default function DeliverymanHome({ navigation, setUserRole }) {
  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        alignItems: 'center'
      }}
      onPress={() => navigation.navigate('DeliverymanOrderDetails', { order: item })}
    >
      <Image
        source={item.image}
        style={{ width: 50, height: 50, marginRight: 10, borderRadius: 5 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: 'bold' }}>{item.customerName}</Text>
        <Text>{item.address}</Text>
        <Text style={{ color: 'gray', fontSize: 12 }}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Active Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
      />

      <Button
        title="Profile"
        onPress={() => navigation.navigate('DeliverymanProfile')}
      />
      <Button
        title="Logout"
        onPress={() => setUserRole(null)}
        color="red"
      />
    </View>
  );
}

