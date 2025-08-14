import React from 'react';
import { Image, View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { portLink } from '../../navigation/AppNavigation';

const items = [
  { id: '1', name: 'Item 1', price: 10, image: require('../../assets/400x400.png') },
  { id: '2', name: 'Item 2', price: 20, image: require('../../assets/400x400.png') },
  { id: '3', name: 'Item 3', price: 30, image: require('../../assets/400x400.png') },
];

export default function BuyerHome({ navigation, setUserRole, userEmail }) {
  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Buyer Home</Text>

        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => navigation.navigate('ItemDetails', { item })}
            >
              <Image
                source={item.image}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
              </View>
            </TouchableOpacity>
          )}
          style={{ marginBottom: 20 }}
        />

        <TouchableOpacity onPress={() => navigation.navigate('BuyerProfile', { email: userEmail })} style={styles.buttonWrapper}>
          <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
            <Text style={styles.buttonText}>Profile</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.buttonWrapper}>
          <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
            <Text style={styles.buttonText}>View Cart</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('OrderTracking')} style={styles.buttonWrapper}>
          <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.button}>
            <Text style={styles.buttonText}>Track Orders</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setUserRole(null)} style={styles.buttonWrapper}>
          <LinearGradient colors={['#7a1f1f', '#4d0f0f']} style={styles.button}>
            <Text style={styles.buttonText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    alignItems: 'center',
  },
  itemImage: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  itemPrice: { fontSize: 14, color: '#aaa', marginTop: 4 },
  buttonWrapper: { marginBottom: 12 },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
