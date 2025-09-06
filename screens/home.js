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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../navigation/AppNavigation';

export default function HomeScreen({ setUserRole, navigation }) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [sortOption, setSortOption] = useState(null); // price-asc, price-desc, rating-asc, rating-desc
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
const [selectedCategories, setSelectedCategories] = useState([]);
const [minPrice, setMinPrice] = useState('');
const [maxPrice, setMaxPrice] = useState('');
const [minRating, setMinRating] = useState('');
const [discountOnly, setDiscountOnly] = useState(false);


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

  // Check login state
  const checkLogin = async () => {
    const token = await AsyncStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    checkLogin();
  }, []);

  const filteredProducts = products.filter(p => {
  const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
  const matchesCategory =
    selectedCategories.length === 0 || selectedCategories.includes(p.category);
  const matchesPrice =
    (!minPrice || p.price >= parseFloat(minPrice)) &&
    (!maxPrice || p.price <= parseFloat(maxPrice));
  const rating = p.rating || 0;
  const matchesRating = !minRating || rating >= parseFloat(minRating);
  const matchesDiscount = !discountOnly || (p.discount && p.discount > 0);

  return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesDiscount;
});


  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating-asc':
        return (a.rating || 0) - (b.rating || 0);
      case 'rating-desc':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  // Add to cart function
  const addToCart = async (productId, quantity) => {
    try {
      const token = await AsyncStorage.getItem('token');
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: token, product_id: productId, quantity }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      Alert.alert('Success', 'Product added to cart');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not add product to cart');
    }
  };

  

  const renderProductImage = imageUrl => {
    if (imageUrl) {
      return (
        <Image
          source={{ uri: `${portLink()}${imageUrl}` }}
          style={styles.productImage}
          resizeMode="contain"
        />
      );
    } else {
      return (
        <Image
          source={{ uri: 'https://via.placeholder.com/120' }}
          style={styles.productImage}
          resizeMode="contain"
        />
      );
    }
  };

  return (
    <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
      {/* Search and Sort */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 20, marginBottom: 10 }}>
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

  <TouchableOpacity
    style={{
      marginLeft: 10,
      paddingHorizontal: 15,
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 10,
    }}
    onPress={() => setSortModalVisible(true)}
  >
    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sort</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{
      marginLeft: 10,
      paddingHorizontal: 15,
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 10,
    }}
    onPress={() => setFilterModalVisible(true)}
  >
    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Filter</Text>
  </TouchableOpacity>
</View>


      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={sortedProducts}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => {
                setSelectedProduct(item);
                setSelectedQuantity(1);
              }}
            >
              {renderProductImage(item.imageUrl)}
              <Text style={styles.productName}>{item.name}</Text>
              {item.discount > 0 ? (
                <>
                  <Text style={styles.originalPrice}>Price: ৳{item.price}</Text>
                  <Text style={styles.discountedPrice}>
                    Price: ৳{(item.price - (item.discount * 0.01 * item.price)).toFixed(2)}
                  </Text>
                </>
              ) : (
                <Text style={styles.productPrice}>Price: ৳{item.price}</Text>
              )}
              <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>
              {item.rating && <Text style={styles.productQuantity}>Rating: {item.rating}</Text>}
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={filterModalVisible} transparent animationType="slide">
  <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback>
        <View style={styles.sortModalContent}>
          <Text style={{ color: '#fff', fontSize: 18, marginBottom: 15 }}>Filter Products</Text>

          {/* Categories */}
          <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 5 }}>Categories:</Text>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                paddingVertical: 5,
              }}
              onPress={() => {
                if (selectedCategories.includes(cat.id)) {
                  setSelectedCategories(prev => prev.filter(id => id !== cat.id));
                } else {
                  setSelectedCategories(prev => [...prev, cat.id]);
                }
              }}
            >
              <Text style={{ color: '#fff' }}>{cat.category_name}</Text>
              {selectedCategories.includes(cat.id) && <Text style={{ color: '#0f0' }}>✓</Text>}
            </TouchableOpacity>
          ))}

          {/* Price Range */}
          <Text style={{ color: '#fff', fontWeight: 'bold', marginVertical: 10 }}>Price Range:</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <TextInput
              placeholder="Min"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
              style={[styles.searchInput, { flex: 1, marginRight: 5 }]}
            />
            <TextInput
              placeholder="Max"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
              style={[styles.searchInput, { flex: 1, marginLeft: 5 }]}
            />
          </View>

          {/* Minimum Rating */}
          <Text style={{ color: '#fff', fontWeight: 'bold', marginVertical: 10 }}>Minimum Rating:</Text>
          <TextInput
            placeholder="0-5"
            placeholderTextColor="#ccc"
            keyboardType="numeric"
            value={minRating}
            onChangeText={setMinRating}
            style={styles.searchInput}
          />

          {/* Discount Only */}
          <TouchableOpacity
            style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}
            onPress={() => setDiscountOnly(prev => !prev)}
          >
            <Ionicons
              name={discountOnly ? 'checkbox' : 'square-outline'}
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: '#fff' }}>Discounted Products Only</Text>
          </TouchableOpacity>

          {/* Apply Filters Button */}
          <TouchableOpacity
            style={[styles.addButton, { marginTop: 15 }]}
            onPress={() => setFilterModalVisible(false)}
          >
            <LinearGradient colors={['#27ae60', '#2ecc71']} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>Apply Filters</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Reset Filters Button */}
          <TouchableOpacity
            style={[styles.addButton, { marginTop: 10 }]}
            onPress={() => {
              setSelectedCategories([]);
              setMinPrice('');
              setMaxPrice('');
              setMinRating('');
              setDiscountOnly(false);
            }}
          >
            <LinearGradient colors={['#c0392b', '#e74c3c']} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>Reset Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>


      {/* Sort Modal */}
      // Replace the Sort Modal section with this
<Modal visible={sortModalVisible} transparent animationType="slide">
  <TouchableWithoutFeedback onPress={() => setSortModalVisible(false)}>
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback>
        <View style={styles.sortModalContent}>
          <Text style={{ color: '#fff', fontSize: 18, marginBottom: 15 }}>Sort By</Text>

          <TouchableOpacity
            style={styles.sortOptionButton}
            onPress={() => {
              setSortOption('price-asc');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>Price: Low to High</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortOptionButton}
            onPress={() => {
              setSortOption('price-desc');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>Price: High to Low</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortOptionButton}
            onPress={() => {
              setSortOption('rating-asc');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>Rating: Low to High</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortOptionButton}
            onPress={() => {
              setSortOption('rating-desc');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>Rating: High to Low</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>


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

                <ScrollView contentContainerStyle={{ paddingTop: 10, alignItems: 'center' }}>
                  {renderProductImage(selectedProduct?.imageUrl)}
                  <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>

                  {selectedProduct?.discount > 0 ? (
                    <>
                      <Text style={styles.originalPrice}>Price: ৳{selectedProduct.price}</Text>
                      <Text style={styles.discountedPrice}>
                        Price: ৳{(selectedProduct.price - (selectedProduct.discount * 0.01 * selectedProduct.price)).toFixed(2)}
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
                  {selectedProduct?.rating && <Text style={styles.modalText}>Rating: {selectedProduct?.rating}</Text>}

                  {isLoggedIn && (
                    <>
                      {/* Quantity selector */}
                      <View style={styles.quantityWrapper}>
                        <Text style={styles.modalText}>Select Quantity:</Text>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => setSelectedQuantity(prev => Math.max(prev - 1, 0))}
                          >
                            <Text style={styles.quantityButtonText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.quantityValue}>{selectedQuantity}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => setSelectedQuantity(prev => Math.min(prev + 1, selectedProduct.quantity))}
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
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Login')}>
            <LinearGradient colors={['#2980b9', '#3498db']} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Cart')}>
              <LinearGradient colors={['#27ae60', '#2ecc71']} style={styles.addButtonGradient}>
                <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>Cart</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('userId');
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
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 45,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  productCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  productName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  productPrice: { color: '#fff', fontSize: 14, marginTop: 4 },
  productQuantity: { color: '#fff', fontSize: 14, marginTop: 2 },
  originalPrice: { color: '#fff', fontSize: 14, textDecorationLine: 'line-through', marginTop: 4 },
  discountedPrice: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  productImage: { width: 120, height: 120, borderRadius: 8 },
  bottomArea: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  addButton: { marginBottom: 12 },
  logoutButton: {},
  addButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
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
  sortModalContent: {
    width: '80%',
    backgroundColor: '#203a43',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  sortOptionButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.2)',
    borderBottomWidth: 1,
  },
  sortOptionText: { color: '#fff', fontSize: 16 },
});
