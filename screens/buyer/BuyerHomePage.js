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
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../../navigation/AppNavigation';

export default function BuyerHomeScreen({ setUserRole, navigation }) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState({}); // { productId: averageRating }
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Delivered unrated orders
  const [unratedOrders, setUnratedOrders] = useState([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [productRatings, setProductRatings] = useState({}); // { productId: rating }
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Fetch rating for a product
  const fetchRatingForProduct = async (productId) => {
    try {
      const response = await fetch(`${portLink()}/ratings/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch rating');
      const data = await response.json();
      return data.average > 0 ? data.average : 'N/A';
    } catch (err) {
      console.error(err);
      return 'N/A';
    }
  };

  // Fetch products and their ratings
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${portLink()}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const productsData = await response.json();
      setProducts(productsData);

      // Fetch ratings for each product
      const ratingsObj = {};
      await Promise.all(
        productsData.map(async (p) => {
          const avg = await fetchRatingForProduct(p.id);
          ratingsObj[p.id] = avg;
        })
      );
      setRatings(ratingsObj);
    } catch (error) {
      console.error(error);
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

  // Check login
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

  // Fetch unrated delivered orders
  const fetchUnratedOrders = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('token');
      if (!userId) return;

      const response = await fetch(`${portLink()}/orders/delivered_unrated/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch unrated orders');
      const data = await response.json();

      if (data.count > 0) {
        setUnratedOrders(data.orders);
        setCurrentOrderIndex(0);
        setProductRatings({});
        setShowRatingModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pull-to-refresh
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchCategories(), checkLogin(), fetchCartCount(), fetchUnratedOrders()]);
    setRefreshing(false);
  };

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

  // Add to cart
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
      fetchCartCount();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not add product to cart');
    }
  };

  // Update rating in modal
  const updateRating = (productId, rating) => {
    setProductRatings(prev => ({ ...prev, [productId]: rating }));
  };

  // Submit ratings for current order and mark order as rated
  const submitRatings = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const currentOrder = unratedOrders[currentOrderIndex];

    // Submit all product ratings
    await Promise.all(
      currentOrder.items.map(async (item) => {
        const rating = productRatings[item.product_id];
        if (!rating) return;

        // Fetch existing rating
        const ratingResponse = await fetch(`${portLink()}/ratings/${item.product_id}`);
        const ratingData = await ratingResponse.json();

        let total = rating;
        let count = 1;

        if (ratingData.rating) {
          total += parseFloat(ratingData.rating.total || 0);
          count += parseInt(ratingData.rating.count || 0);
        }

        // Update rating for the product
        const updateResponse = await fetch(`${portLink()}/ratings/update/${item.product_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ total, count }),
        });

        if (!updateResponse.ok) {
          const text = await updateResponse.text();
          console.error(`Failed to update rating for ${item.product_id}:`, text);
        }
      })
    );

    // Mark order as rated
    const orderResponse = await fetch(`${portLink()}/orders/rating_order/${currentOrder.order_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!orderResponse.ok) {
      const text = await orderResponse.text();
      console.error('Failed to mark order as rated:', text);
    }

    // Move to next order
    const nextIndex = currentOrderIndex + 1;
    if (nextIndex < unratedOrders.length) {
      setCurrentOrderIndex(nextIndex);
      setProductRatings({});
    } else {
      setShowRatingModal(false);
      setUnratedOrders([]);
    }

  } catch (err) {
    console.error('submitRatings error:', err);
    Alert.alert('Error', 'Failed to submit ratings');
  }
};


  // Skip current order
  const skipOrder = () => {
    const nextIndex = currentOrderIndex + 1;
    if (nextIndex < unratedOrders.length) {
      setCurrentOrderIndex(nextIndex);
      setProductRatings({});
    } else {
      setShowRatingModal(false);
      setUnratedOrders([]);
    }
  };

  return (
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
      {/* Search */}
      <View style={styles.topArea}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#8B3E1A" style={{ marginHorizontal: 10 }} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#8B3E1A"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#C75D2C" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAll} colors={['#C75D2C']} tintColor="#C75D2C" />
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
              <Text style={styles.productQuantity}>
                Rating: {ratings[item.id] !== undefined ? ratings[item.id] : 'Loading...'}
              </Text>
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
              <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContentGradient}>
                <TouchableOpacity
                  style={styles.closeIconWrapper}
                  onPress={() => setSelectedProduct(null)}
                >
                  <Ionicons name="close" size={28} color="#8B3E1A" />
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

                  <Text style={styles.modalText}>
                    Rating: {ratings[selectedProduct?.id] !== undefined ? ratings[selectedProduct?.id] : 'Loading...'}
                  </Text>

                  {isLoggedIn && (
                    <>
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

                      <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={() => addToCart(selectedProduct.id, selectedQuantity)}
                      >
                        <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.addButtonGradient}>
                          <Ionicons name="cart" size={20} color="#F3E9DC" style={{ marginRight: 8 }} />
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

      {/* Rating Modal for Delivered Unrated Orders */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContentGradient}>
            <Text style={[styles.modalTitle, { fontSize: 18 }]}>Rate your products</Text>

            <ScrollView style={{ maxHeight: 400, marginVertical: 10 }}>
              {unratedOrders[currentOrderIndex]?.items.map((item) => (
                <View key={item.product_id} style={{ marginVertical: 10 }}>
                  <Text style={styles.modalText}>{item.product_name || 'Product'}</Text>

                  <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => updateRating(item.product_id, star)}
                      >
                        <FontAwesome
                          name={productRatings[item.product_id] >= star ? 'star' : 'star-o'}
                          size={24}
                          color="#F8B259"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.addButtonGradient, { flex: 0.45 }]}
                onPress={skipOrder}
              >
                <LinearGradient colors={['#C75D2C', '#8B3E1A']} style={styles.addButtonGradient}>
                  <Text style={styles.addButtonText}>Skip</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButtonGradient, { flex: 0.45 }]}
                onPress={submitRatings}
              >
                <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.addButtonGradient}>
                  <Text style={styles.addButtonText}>Submit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Bottom Buttons */}
      <View style={styles.bottomArea}>
        {!isLoggedIn ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('BuyerProfile')}
            >
              <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.addButtonGradient}>
                <Ionicons name="person-circle" size={20} color="#F3E9DC" style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>Profile</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('OrderTracking')}
            >
              <LinearGradient colors={['#F8B259', '#D96F32']} style={styles.addButtonGradient}>
                <Ionicons name="reader" size={20} color="#8B3E1A" style={{ marginRight: 8 }} />
                <Text style={[styles.addButtonText, { color: '#8B3E1A' }]}>Orders</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.addButtonGradient}>
                <Ionicons name="cart" size={20} color="#F3E9DC" style={{ marginRight: 8 }} />
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
              <LinearGradient colors={['#C75D2C', '#8B3E1A']} style={styles.addButtonGradient}>
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
  topArea: { padding: 15 },
  searchWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(243, 233, 220, 0.9)', 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D96F32'
  },
  searchInput: { flex: 1, color: '#8B3E1A', height: 40, fontWeight: '500' },
  productCard: { 
    padding: 15, 
    backgroundColor: 'rgba(243, 233, 220, 0.9)', 
    borderRadius: 12, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(215, 111, 50, 0.3)',
    shadowColor: '#C75D2C',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  productName: { fontSize: 18, color: '#8B3E1A', fontWeight: 'bold' },
  productPrice: { color: '#C75D2C', marginTop: 5, fontWeight: '600' },
  originalPrice: { color: '#999', textDecorationLine: 'line-through', marginTop: 5 },
  discountedPrice: { color: '#D96F32', marginTop: 3, fontWeight: 'bold' },
  productQuantity: { color: '#8B3E1A', marginTop: 3 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContentGradient: { 
    width: '90%', 
    borderRadius: 20, 
    padding: 20, 
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#C75D2C'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#8B3E1A', textAlign: 'center', marginBottom: 10 },
  modalText: { color: '#8B3E1A', marginTop: 5, fontWeight: '500' },
  quantityWrapper: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  quantityButton: { backgroundColor: '#C75D2C', padding: 8, borderRadius: 8 },
  quantityButtonText: { color: '#F3E9DC', fontSize: 18, width: 25, textAlign: 'center', fontWeight: 'bold' },
  quantityValue: { color: '#8B3E1A', fontSize: 18, marginHorizontal: 15, fontWeight: 'bold' },
  addToCartButton: { marginTop: 15 },
  addButtonGradient: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 10,
    shadowColor: '#8B3E1A',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addButtonText: { 
    color: '#F3E9DC', 
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeIconWrapper: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
  bottomArea: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 5, 
    justifyContent: 'space-around',
    backgroundColor: 'rgba(243, 233, 220, 0.1)'
  },
  addButton: { margin: 5, flexDirection: 'row', flex: 0.45 },
  logoutButton: { margin: 5, flex: 0.45 },
});