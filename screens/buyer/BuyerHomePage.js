import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  TouchableWithoutFeedback,
  ScrollView,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../../navigation/AppNavigation';

export default function BuyerHomeScreen({ setUserRole, navigation }) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0); // Cart count state
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${portLink()}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Fetch products error:', error);
      Alert.alert('Error', 'Failed to fetch products.');
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

  // Check login state
  const checkLogin = async () => {
    const token = await AsyncStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token) return;

      const response = await fetch(`${portLink()}/cart/count/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch cart count');
      const data = await response.json();
      setCartCount(data.itemCount);
    } catch (err) {
      console.error(err);
    }
  };

  // Pull-to-refresh function
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchCategories(), checkLogin(), fetchCartCount()]);
    setRefreshing(false);
  };

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Add to cart function
  const addToCart = async (productId, quantity) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to add products to cart');
        return;
      }

      if (quantity <= 0) {
        Alert.alert('Error', 'Please select at least 1 quantity');
        return;
      }

      const response = await fetch(`${portLink()}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, product_id: productId, quantity }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      Alert.alert('Success', 'Product added to cart');
      fetchCartCount(); // update cart count
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not add product to cart');
    }
  };

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
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
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAll} colors={['#fff']} tintColor="#fff" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => {
                setSelectedProduct(item);
                setSelectedQuantity(1);
              }}
            >
              <Text style={styles.productName}>{item.name}</Text>

              {item.discount > 0 ? (
                <>
                  <Text style={styles.originalPrice}>Price: ৳{item.price}</Text>
                  <Text style={styles.discountedPrice}>
                    Price: ৳{(item.price - item.discount * 0.01 * item.price).toFixed(2)}
                  </Text>
                </>
              ) : (
                <Text style={styles.productPrice}>Price: ৳{item.price}</Text>
              )}

              <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Product Details Modal */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedProduct(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.modalContentGradient}>
                <TouchableOpacity
                  style={styles.closeIconWrapper}
                  onPress={() => setSelectedProduct(null)}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={{ paddingTop: 10 }}>
                  <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>

                  {selectedProduct?.discount > 0 ? (
                    <>
                      <Text style={styles.originalPrice}>Price: ৳{selectedProduct.price}</Text>
                      <Text style={styles.discountedPrice}>
                        Price: ৳{(selectedProduct.price - selectedProduct.discount * 0.01 * selectedProduct.price).toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.modalText}>Price: ৳{selectedProduct?.price}</Text>
                  )}

                  <Text style={styles.modalText}>Quantity: {selectedProduct?.quantity}</Text>
                  <Text style={styles.modalText}>Weight: {selectedProduct?.weight || 'N/A'}</Text>
                  <Text style={styles.modalText}>
                    Category: {categories.find(cat => cat.id === selectedProduct?.category)?.category_name || 'N/A'}
                  </Text>
                  <Text style={styles.modalText}>Description: {selectedProduct?.description || 'N/A'}</Text>

                  {isLoggedIn && (
                    <>
                      {/* Quantity selector */}
                      <View style={styles.quantityWrapper}>
                        <Text style={styles.modalText}>Select Quantity:</Text>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() =>
                              setSelectedQuantity(prev => Math.max(prev - 1, 0))
                            }
                          >
                            <Text style={styles.quantityButtonText}>-</Text>
                          </TouchableOpacity>

                          <Text style={styles.quantityValue}>{selectedQuantity}</Text>

                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() =>
                              setSelectedQuantity(prev => Math.min(prev + 1, selectedProduct.quantity))
                            }
                          >
                            <Text style={styles.quantityButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Add to Cart button */}
                      <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={() => addToCart(selectedProduct.id, selectedQuantity)}
                      >
                        <LinearGradient colors={['#27ae60', '#2ecc71']} style={styles.addButtonGradient}>
                          <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={styles.addButtonText}>Add to Cart</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  )}
                </ScrollView>
              </LinearGradient>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Bottom Buttons */}
      <View style={styles.bottomArea}>
        {!isLoggedIn ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient colors={['#2980b9', '#3498db']} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('BuyerProfile')}
            >
              <LinearGradient colors={['#2729aeff', '#7007e1ff']} style={styles.addButtonGradient}>
                <Ionicons name="person-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>Profile</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('OrderTracking')}
            >
              <LinearGradient colors={['#ae273bff', '#e19c07ff']} style={styles.addButtonGradient}>
                <Ionicons name="reader" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>Orders</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <LinearGradient colors={['#27ae60', '#2ecc71']} style={styles.addButtonGradient}>
                <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>
                  Cart {cartCount > 0 ? `(${cartCount})` : ''}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => {
                await AsyncStorage.removeItem('token');
                setIsLoggedIn(false);
                setUserRole(null);
              }}
            >
              <LinearGradient colors={['#c0392b', '#e74c3c']} style={styles.addButtonGradient}>
                <Text style={styles.addButtonText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topArea: { paddingTop: 20, paddingBottom: 10 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, marginHorizontal: 20, paddingHorizontal: 10, height: 45 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  productCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 15, marginBottom: 12 },
  productName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  productPrice: { color: '#fff', fontSize: 14, marginTop: 4 },
  productQuantity: { color: '#fff', fontSize: 14, marginTop: 2 },
  originalPrice: { color: '#fff', fontSize: 14, textDecorationLine: 'line-through', marginTop: 4 },
  discountedPrice: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  bottomArea: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  addButton: { marginBottom: 12 },
  logoutButton: {},
  addButtonGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentGradient: { width: '85%', borderRadius: 10, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalText: { color: '#fff', fontSize: 16, marginBottom: 6 },
  closeIconWrapper: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 5 },
  quantityWrapper: { marginVertical: 10, alignItems: 'center' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', marginTop: 5, justifyContent: 'center' },
  quantityButton: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 6 },
  quantityButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  quantityValue: { color: '#fff', fontSize: 16, marginHorizontal: 15, minWidth: 30, textAlign: 'center' },
  addToCartButton: { marginTop: 10 },
});
