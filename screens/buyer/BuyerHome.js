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
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
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
          <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.button}>
            <Text style={styles.buttonText}>Profile</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.buttonWrapper}>
          <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.button}>
            <Text style={styles.buttonText}>View Cart</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('OrderTracking')} style={styles.buttonWrapper}>
          <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.button}>
            <Text style={styles.buttonText}>Track Orders</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setUserRole(null)} style={styles.buttonWrapper}>
          <LinearGradient colors={['#C75D2C', '#8B3E1A']} style={styles.button}>
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
    color: '#8B3E1A',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 233, 220, 0.9)',
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#C75D2C',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.3)',
  },
  itemImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 10, 
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#D96F32'
  },
  itemInfo: { flex: 1 },
  itemName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#8B3E1A'
  },
  itemPrice: { 
    fontSize: 14, 
    color: '#C75D2C', 
    marginTop: 4,
    fontWeight: '600'
  },
  buttonWrapper: { marginBottom: 12 },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#8B3E1A',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: {
    color: '#F3E9DC',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});