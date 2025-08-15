import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Modal, Alert, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../navigation/AppNavigation';

export default function HomeScreen({ setUserRole, navigation }) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    discount: 0,
    quantity: 0,
    description: '',
    weight: '',
    category: null,
  });

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${portLink()}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Fetch products error:', error);
      Alert.alert('Error', 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${portLink()}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  // Check login state from AsyncStorage
  const checkLogin = async () => {
    const user = await AsyncStorage.getItem('userToken'); // Example key
    setIsLoggedIn(!!user);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    checkLogin();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LinearGradient colors={['#0f2027','#203a43','#2c5364']} style={styles.container}>
      {/* Search */}
      <View style={styles.topArea}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#fff" style={{ marginHorizontal: 10 }} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#ccc"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>Price: ৳{item.price}</Text>
              <Text style={styles.productDiscount}>Discount: {item.discount}%</Text>
              <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>
            </View>
          )}
        />
      )}

      {/* Bottom Buttons */}
      <View style={styles.bottomArea}>
        {!isLoggedIn ? (
          // Not logged in → show Login
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('LoginScreen')}
          >
            <LinearGradient colors={['#2980b9', '#3498db']} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          // Logged in → show Cart and Logout
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CartScreen')}
            >
              <LinearGradient colors={['#27ae60', '#2ecc71']} style={styles.addButtonGradient}>
                <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>Cart</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => {
                await AsyncStorage.removeItem('userToken'); // Clear login
                setIsLoggedIn(false);
                setUserRole(null);
              }}
            >
              <LinearGradient colors={['#c0392b','#e74c3c']} style={styles.addButtonGradient}>
                <Text style={styles.addButtonText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Add Product Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAddModalVisible(false)}>
          <View style={styles.dropdownOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
              />
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={newProduct.price.toString()}
                onChangeText={(text) => setNewProduct({ ...newProduct, price: Number(text) })}
              />
              <TouchableOpacity
                style={[styles.addButtonGradient, { marginTop: 10 }]}
                onPress={() => {
                  // Call API to save new product
                  setAddModalVisible(false);
                }}
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex:1 },
  topArea: { paddingTop: 20, paddingBottom: 10 },
  searchWrapper: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.05)', borderRadius:10, marginHorizontal:20, paddingHorizontal:10, height:45 },
  searchInput: { flex:1, color:'#fff', fontSize:16 },
  productCard: { backgroundColor:'rgba(255,255,255,0.05)', borderRadius:10, padding:15, marginBottom:12, position:'relative' },
  productName: { color:'#fff', fontSize:16, fontWeight:'bold' },
  productPrice: { color:'#fff', fontSize:14, marginTop:4 },
  productDiscount: { color:'#fff', fontSize:14, marginTop:2 },
  productQuantity: { color:'#fff', fontSize:14, marginTop:2 },
  bottomArea: { position:'absolute', bottom:20, left:20, right:20 },
  addButton: { marginBottom:12 },
  logoutButton: {},
  addButtonGradient: { flexDirection:'row', justifyContent:'center', alignItems:'center', paddingVertical:14, borderRadius:10 },
  addButtonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  modalContent: { width:'90%', backgroundColor:'rgba(255,255,255,0.05)', borderRadius:10, minWidth:280, padding:20, marginVertical:20 },
  modalTitle: { color:'#fff', fontSize:18, fontWeight:'bold', marginBottom:10 },
  label: { color:'#fff', marginBottom:4, fontWeight:'bold' },
  modalInput: { backgroundColor:'rgba(255,255,255,0.1)', color:'#fff', borderRadius:8, paddingHorizontal:10, paddingVertical:8, marginBottom:10 },
  dropdownOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
});
