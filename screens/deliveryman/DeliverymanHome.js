import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

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
      style={styles.orderCard}
      onPress={() => navigation.navigate('DeliverymanOrderDetails', { order: item })}
    >
      <Image
        source={item.image}
        style={styles.orderImage}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.address}>{item.address}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <Text style={styles.title}>Active Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Profile Button */}
<TouchableOpacity onPress={() => navigation.navigate('DeliverymanProfile')} style={{ marginTop: 20 }}>
  <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
    <Text style={styles.buttonText}>Profile</Text>
  </LinearGradient>
</TouchableOpacity>

{/* Logout Button */}
<TouchableOpacity onPress={() => setUserRole(null)} style={{ marginTop: 10 }}>
  <LinearGradient colors={['#7a1f1f', '#4d0f0f']} style={styles.button}>
    <Text style={styles.buttonText}>Logout</Text>
  </LinearGradient>
</TouchableOpacity>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  orderCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  orderImage: {
    width: 60,
    height: 60,
    marginRight: 15,
    borderRadius: 8
  },
  customerName: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16
  },
  address: {
    color: '#ccc',
    fontSize: 14
  },
  status: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});
