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
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../../navigation/AppNavigation';

export default function BuyerHomeScreen({ setUserRole, navigation }) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [unratedOrders, setUnratedOrders] = useState([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [productRatings, setProductRatings] = useState({});
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [discountOnly, setDiscountOnly] = useState(false);


  // Sorting states
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOption, setSortOption] = useState(null); // 'priceLowHigh', 'priceHighLow', 'ratingLowHigh', 'ratingHighLow'

  // Helper to get full image URL
  const getFullImageUrl = (imageUrl) => `${portLink()}${imageUrl}`;

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

  // Fetch products and ratings
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${portLink()}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const productsData = await response.json();
      setProducts(productsData);

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
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      checkLogin(),
      fetchCartCount(),
      fetchUnratedOrders(),
    ]);
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(p.category);

    const matchesPrice =
      (!minPrice || p.price >= parseFloat(minPrice)) &&
      (!maxPrice || p.price <= parseFloat(maxPrice));

    const productRating = ratings[p.id] !== undefined ? ratings[p.id] : 0;
    const matchesRating = !minRating || productRating >= parseFloat(minRating);

    const matchesDiscount = !discountOnly || (p.discount && p.discount > 0);

    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesDiscount;
  });


  // Sorting function
  const getSortedProducts = () => {
    if (!sortOption) return filteredProducts;

    const sorted = [...filteredProducts];

    switch (sortOption) {
      case 'priceLowHigh':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'priceHighLow':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'ratingLowHigh':
        sorted.sort((a, b) => (ratings[a.id] || 0) - (ratings[b.id] || 0));
        break;
      case 'ratingHighLow':
        sorted.sort((a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0));
        break;
    }

    return sorted;
  };

  const sortedProducts = getSortedProducts();

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



  // Update rating
  const updateRating = (productId, rating) => {
    setProductRatings(prev => ({ ...prev, [productId]: rating }));
  };

  // Submit ratings
  const submitRatings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const currentOrder = unratedOrders[currentOrderIndex];

      await Promise.all(
        currentOrder.items.map(async (item) => {
          const rating = productRatings[item.product_id];
          if (!rating) return;

          const ratingResponse = await fetch(`${portLink()}/ratings/${item.product_id}`);
          const ratingData = await ratingResponse.json();

          let total = rating;
          let count = 1;

          if (ratingData.rating) {
            total += parseFloat(ratingData.rating.total || 0);
            count += parseInt(ratingData.rating.count || 0);
          }

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

      {/* Sort Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#F3E9DC',
          padding: 10,
          borderRadius: 12,
          marginHorizontal: 20,
          marginVertical: 10,
          alignItems: 'center',
        }}
        onPress={() => setShowSortModal(true)}
      >
        <Text style={{ color: '#8B3E1A', fontWeight: 'bold' }}>Sort</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: '#F3E9DC',
          padding: 10,
          borderRadius: 12,
          marginHorizontal: 20,
          marginVertical: 10,
          alignItems: 'center',
        }}
        onPress={() => setShowFilterModal(true)}
      >
        <Text style={{ color: '#8B3E1A', fontWeight: 'bold' }}>Filter</Text>
      </TouchableOpacity>


      <Modal visible={showFilterModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContentGradient}>
                <Text style={[styles.modalTitle, { fontSize: 18, textAlign: 'center' }]}>Filter Products</Text>

                <ScrollView style={{ maxHeight: 400 }}>
                  {/* Categories */}
                  <Text style={styles.modalText}>Categories</Text>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        setSelectedCategories(prev =>
                          prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id]
                        );
                      }}
                      style={{
                        padding: 10,
                        backgroundColor: selectedCategories.includes(cat.id) ? '#D96F32' : '#F3E9DC',
                        borderRadius: 8,
                        marginVertical: 5,
                      }}
                    >
                      <Text style={{ color: selectedCategories.includes(cat.id) ? '#F3E9DC' : '#8B3E1A' }}>
                        {cat.category_name}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* Price */}
                  <Text style={styles.modalText}>Price Range</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TextInput
                      placeholder="Min"
                      value={minPrice}
                      onChangeText={setMinPrice}
                      keyboardType="numeric"
                      style={{ flex: 0.45, backgroundColor: '#F3E9DC', padding: 8, borderRadius: 8 }}
                    />
                    <TextInput
                      placeholder="Max"
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                      keyboardType="numeric"
                      style={{ flex: 0.45, backgroundColor: '#F3E9DC', padding: 8, borderRadius: 8 }}
                    />
                  </View>

                  {/* Rating */}
                  <Text style={styles.modalText}>Minimum Rating</Text>
                  <TextInput
                    placeholder="1-5"
                    value={minRating}
                    onChangeText={setMinRating}
                    keyboardType="numeric"
                    style={{ backgroundColor: '#F3E9DC', padding: 8, borderRadius: 8, marginVertical: 5 }}
                  />

                  {/* Discount */}
                  <TouchableOpacity
                    style={{
                      padding: 10,
                      backgroundColor: discountOnly ? '#D96F32' : '#F3E9DC',
                      borderRadius: 8,
                      marginVertical: 5,
                    }}
                    onPress={() => setDiscountOnly(prev => !prev)}
                  >
                    <Text style={{ color: discountOnly ? '#F3E9DC' : '#8B3E1A' }}>Discount Only</Text>
                  </TouchableOpacity>

                  {/* Apply Button */}
                  <TouchableOpacity
                    style={{
                      padding: 12,
                      backgroundColor: '#C75D2C',
                      borderRadius: 8,
                      marginTop: 10,
                      alignItems: 'center',
                    }}
                    onPress={() => setShowFilterModal(false)}
                  >
                    <Text style={{ color: '#F3E9DC', fontWeight: 'bold' }}>Apply Filters</Text>
                  </TouchableOpacity>
                </ScrollView>
              </LinearGradient>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>


      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#C75D2C" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={sortedProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshAll} colors={['#C75D2C']} tintColor="#C75D2C" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => setSelectedProduct(item)}
            >
              {/* Product Image */}
              <Image
                source={{ uri: getFullImageUrl(item.imageUrl) }}
                style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 10 }}
                resizeMode="cover"
              />

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

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContentGradient}>
                <Text style={[styles.modalTitle, { fontSize: 18, textAlign: 'center' }]}>Sort Products</Text>

                {[
                  { key: 'priceLowHigh', label: 'Price: Low to High' },
                  { key: 'priceHighLow', label: 'Price: High to Low' },
                  { key: 'ratingLowHigh', label: 'Rating: Low to High' },
                  { key: 'ratingHighLow', label: 'Rating: High to Low' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={{
                      padding: 15,
                      marginVertical: 5,
                      backgroundColor: '#F3E9DC',
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setSortOption(option.key);
                      setShowSortModal(false);
                    }}
                  >
                    <Text style={{ color: '#8B3E1A', fontWeight: 'bold' }}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </LinearGradient>
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
              <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContentGradient}>
                <TouchableOpacity
                  style={styles.closeIconWrapper}
                  onPress={() => setSelectedProduct(null)}
                >
                  <Ionicons name="close" size={28} color="#8B3E1A" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={{ paddingTop: 10 }}>
                  {/* Image */}
                  <Image
                    source={{ uri: selectedProduct ? getFullImageUrl(selectedProduct.imageUrl) : null }}
                    style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 10 }}
                    resizeMode="cover"
                  />

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

      {/* Rating Modal */}
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
                <Text style={styles.addButtonText}>Orders</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.addButtonGradient}>
                <Ionicons name="cart" size={20} color="#F3E9DC" style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>Cart ({cartCount})</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={async () => {
                await AsyncStorage.clear();
                setUserRole(null);
                setIsLoggedIn(false);
              }}
            >
              <LinearGradient colors={['#C75D2C', '#8B3E1A']} style={styles.addButtonGradient}>
                <Ionicons name="log-out" size={20} color="#F3E9DC" style={{ marginRight: 8 }} />
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
  topArea: { padding: 10 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E9DC',
    borderRadius: 12,
  },
  searchInput: { flex: 1, color: '#8B3E1A', paddingVertical: 8 },
  productCard: {
    backgroundColor: '#F3E9DC',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#8B3E1A' },
  productPrice: { fontSize: 14, color: '#8B3E1A' },
  originalPrice: { fontSize: 14, color: '#8B3E1A', textDecorationLine: 'line-through' },
  discountedPrice: { fontSize: 14, color: '#D96F32', fontWeight: 'bold' },
  productQuantity: { fontSize: 12, color: '#8B3E1A' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContentGradient: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  closeIconWrapper: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#8B3E1A', marginBottom: 10 },
  modalText: { fontSize: 14, color: '#8B3E1A', marginVertical: 2 },
  quantityWrapper: { marginVertical: 10 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#D96F32',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  quantityButtonText: { color: '#F3E9DC', fontSize: 18, fontWeight: 'bold' },
  quantityValue: { marginHorizontal: 10, fontSize: 16 },
  addToCartButton: { marginTop: 10 },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: { color: '#F3E9DC', fontWeight: 'bold', fontSize: 16 },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  addButton: { flex: 1, marginHorizontal: 5 },
});

