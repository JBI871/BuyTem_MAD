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
  ScrollView,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../../navigation/AppNavigation';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

export default function ShopkeeperHome({ setUserRole, setUserEmail }) {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const [sortOption, setSortOption] = useState(null); // 'price-asc', 'price-desc', 'rating-desc'
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);

 



  // image state for add + edit
  const [newProductImageUri, setNewProductImageUri] = useState(null);
  const [editProductImageUri, setEditProductImageUri] = useState(null); // if user picks a replacement

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    discount: 0,
    quantity: 0,
    description: '',
    weight: '',
    category: null,
  });

  // ----------- HELPERS -----------
  const withAuthHeaders = async (extra = {}) => {
    const token = await AsyncStorage.getItem('token');
    return {
      ...extra,
      headers: {
        ...(extra.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // const uploadImageIfNeeded = async (localUri) => {
  //   if (!localUri) return null;
  //   const token = await AsyncStorage.getItem('token');

  //   const formData = new FormData();
  //   formData.append('image', {
  //     uri: localUri,
  //     name: 'product.jpg',
  //     type: 'image/jpeg',
  //   });

  //   const res = await fetch(`${portLink()}/products/add`, {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //       // NOTE: Do NOT set Content-Type; letting fetch set boundary for FormData
  //     },
  //     body: formData,
  //   });

  //   if (!res.ok) {
  //     const t = await res.text();
  //     throw new Error(`Image upload failed: ${t}`);
  //   }
  //   const data = await res.json();
  //   return data.imageUrl; // backend should return { imageUrl: '/uploads/xxxx.jpg' }
  // };

  // ----------- FETCHERS -----------
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${portLink()}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      // Fetch ratings for each product
      const productsWithRatings = await Promise.all(
        data.map(async (product) => {
          try {
            const ratingRes = await fetch(`${portLink()}/ratings/${product.id}`);
            const ratingData = await ratingRes.json();
            return { ...product, rating: ratingData.rating, averageRating: ratingData.average };
          } catch (err) {
            console.error('Error fetching rating for product', product.id, err);
            return { ...product, rating: null, averageRating: 0 };
          }
        })
      );
      setProducts(productsWithRatings);
    } catch (error) {
      console.error('Fetch products error:', error);
      Alert.alert('Error', 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${portLink()}/orders/pending-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch pending count');
      const data = await response.json();
      setPendingCount(data.pendingCount || 0);
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  };

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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchPendingCount();
  }, []);

  // ----------- FILTER -----------
  const filteredProducts = products
  .filter((p) => p.name?.toLowerCase()?.includes(search.toLowerCase()));




  // ----------- EDIT -----------
  const openEditModal = (product) => {
    setSelectedProduct({ ...product }); // keep existing imageUrl inside
    setEditProductImageUri(null); // reset replacement state
    setEditModalVisible(true);
  };

  const saveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      // If user picked a new image, upload it and replace imageUrl
      let imageUrl = selectedProduct?.imageUrl || null;
      if (editProductImageUri) {
        imageUrl = await uploadImageIfNeeded(editProductImageUri);
      }

      const payload = {
        ...selectedProduct,
        category: selectedProduct.category?.id || selectedProduct.category, // ensure id goes
        imageUrl, // keep or set
      };

      const response = await fetch(`${portLink()}/products/update/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update product');

      await fetchProducts();
      setEditModalVisible(false);
      Alert.alert('Success', 'Product updated successfully');
    } catch (error) {
      console.error('Update product error:', error);
      Alert.alert('Error', 'Failed to update product.');
    }
  };

  // ----------- DELETE -----------
  const removeProduct = async (id) => {
    Alert.alert('Remove Product', 'Are you sure you want to remove this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');

            // Delete rating first (best-effort)
            await fetch(`${portLink()}/ratings/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { });

            // Then delete product
            const response = await fetch(`${portLink()}/products/delete/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to remove product');

            await fetchProducts();
            Alert.alert('Success', 'Product removed successfully');
          } catch (error) {
            console.error('Remove product error:', error);
            Alert.alert('Error', 'Failed to remove product.');
          }
        },
      },
    ]);
  };

  // ----------- ADD -----------
  const saveNewProduct = async () => {
    if (!newProduct.category) {
      Alert.alert('Error', 'Please select a category.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');

      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      formData.append('discount', newProduct.discount);
      formData.append('quantity', newProduct.quantity);
      formData.append('description', newProduct.description);
      formData.append('weight', newProduct.weight);
      formData.append('category', newProduct.category.id);

      if (newProductImageUri) {
        formData.append('image', {
          uri: newProductImageUri,
          name: 'product.jpg',
          type: 'image/jpeg',
        });
      }

      const response = await fetch(`${portLink()}/products/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type; fetch handles it automatically for FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error('Failed to add product');

      // Add initial rating
      await fetch(`${portLink()}/ratings/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: data.id, count: 0, total: 0 }),
      }).catch(() => { });

      await fetchProducts();
      setAddModalVisible(false);
      setNewProduct({
        name: '',
        price: 0,
        discount: 0,
        quantity: 0,
        description: '',
        weight: '',
        category: null,
      });
      setNewProductImageUri(null);
      Alert.alert('Success', 'Product added successfully');
    } catch (error) {
      console.error('Add product error:', error);
      Alert.alert('Error', 'Failed to add product.');
    }
  };

  // ----------- CATEGORY -----------
  const saveNewCategory = async () => {
    if (!newCategoryName.trim()) return Alert.alert('Error', 'Category name cannot be empty');
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${portLink()}/categories/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category_name: newCategoryName.trim() }),
      });
      if (!response.ok) throw new Error('Failed to add category');
      setNewCategoryName('');
      setAddCategoryModalVisible(false);
      await fetchCategories();
      Alert.alert('Success', 'Category added successfully');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add category');
    }
  };



  // ----------- IMAGE PICKERS -----------
  const pickNewProductImage = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (res.status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setNewProductImageUri(result.assets[0].uri);
    }
  };

  const pickEditProductImage = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (res.status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setEditProductImageUri(result.assets[0].uri);
    }
  };

  // ----------- UI PARTS -----------
  const CategoryDropdown = ({ selected, onSelect }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <TouchableOpacity
        style={[styles.modalInput, { flex: 1, justifyContent: 'center' }]}
        onPress={() => setCategoryDropdownVisible(true)}
      >
        <Text style={{ color: '#C75D2C' }}>
          {selected ? selected.category_name : 'Select Category'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modalInput,
          { width: 45, marginLeft: 8, justifyContent: 'center', alignItems: 'center', padding: 0 },
        ]}
        onPress={() => setAddCategoryModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#C75D2C" />
      </TouchableOpacity>

      <Modal transparent visible={categoryDropdownVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setCategoryDropdownVisible(false)}>
          <View style={styles.dropdownOverlay}>
            <View style={styles.dropdownSolid}>
              <ScrollView>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      onSelect(cat);
                      setCategoryDropdownVisible(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text style={{ color: '#C75D2C', fontWeight: 'bold', fontSize: 16 }}>
                      {cat.category_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );

  return (
    <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.container}>
      {/* Search */}
      <View style={styles.topArea}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#C75D2C" style={{ marginHorizontal: 10 }} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#D96F32"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
        <TouchableOpacity
          style={[styles.modalInput, { justifyContent: 'center' }]}
          onPress={() => setSortDropdownVisible(true)}
        >
          <Text style={{ color: '#C75D2C' }}>
            {sortOption
              ? sortOption === 'price-asc'
                ? 'Price: Low → High'
                : sortOption === 'price-desc'
                  ? 'Price: High → Low'
                  : sortOption === 'rating-desc'
                    ? 'Rating: High → Low'
                    : 'Rating: Low → High'
              : 'Sort Products'}
          </Text>


        </TouchableOpacity>
        



        <Modal transparent visible={sortDropdownVisible} animationType="fade">
          <TouchableWithoutFeedback onPress={() => setSortDropdownVisible(false)}>
            <View style={styles.dropdownOverlay}>
              <View style={styles.dropdownSolid}>
                {[
                  { label: 'Price: Low → High', value: 'price-asc' },
                  { label: 'Price: High → Low', value: 'price-desc' },
                  { label: 'Rating: High → Low', value: 'rating-desc' },
                  { label: 'Rating: Low → High', value: 'rating-asc' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSortOption(opt.value);
                      setSortDropdownVisible(false);
                    }}
                  >
                    <Text style={{ color: '#C75D2C', fontWeight: 'bold', fontSize: 16 }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>


      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#C75D2C" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          renderItem={({ item }) => {
            const averageRating =
              item.rating && item.rating.count > 0
                ? (item.rating.total / item.rating.count).toFixed(2)
                : 'N/A';

            return (
              <View style={styles.productCard}>
                {/* image */}
                {item.imageUrl ? (
                  <Image
                    source={{ uri: `${portLink()}${item.imageUrl}` }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : null}

                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>Price: ৳{item.price}</Text>
                <Text style={styles.productDiscount}>Discount: {item.discount}%</Text>
                <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>
                <Text style={styles.productQuantity}>Rating: {averageRating}</Text>

                <TouchableOpacity style={styles.editIcon} onPress={() => openEditModal(item)}>
                  <Ionicons name="create-outline" size={20} color="#C75D2C" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.removeButton} onPress={() => removeProduct(item.id)}>
                  <Ionicons name="trash-outline" size={18} color="#C75D2C" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Bottom Buttons */}
      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AdminOrder')}>
          <LinearGradient colors={['#D96F32', '#C75D2C']} style={styles.addButtonGradient}>
            <Ionicons name="reader" size={20} color="#F3E9DC" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>Orders</Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <LinearGradient colors={['#F8B259', '#D96F32']} style={styles.addButtonGradient}>
            <Ionicons name="add" size={24} color="#F3E9DC" />
            <Text style={styles.addButtonText}>Add New Product</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await AsyncStorage.removeItem('token');
            setUserRole?.(null);
            setUserEmail?.(null);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }}
        >
          <LinearGradient colors={['#C75D2C', '#D96F32']} style={styles.addButtonGradient}>
            <Text style={styles.addButtonText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Add Product Modal */}
      <Modal animationType="slide" transparent={true} visible={addModalVisible}>
        <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Product</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newProduct.name}
              onChangeText={(text) => setNewProduct((prev) => ({ ...prev, name: text }))}
            />

            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={String(newProduct.price)}
              onChangeText={(text) => setNewProduct((prev) => ({ ...prev, price: Number(text) }))}
            />

            <Text style={styles.label}>Discount</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={String(newProduct.discount)}
              onChangeText={(text) =>
                setNewProduct((prev) => ({ ...prev, discount: Number(text) }))
              }
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={String(newProduct.quantity)}
              onChangeText={(text) =>
                setNewProduct((prev) => ({ ...prev, quantity: Number(text) }))
              }
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              multiline
              value={newProduct.description}
              onChangeText={(text) =>
                setNewProduct((prev) => ({ ...prev, description: text }))
              }
            />

            <Text style={styles.label}>Weight</Text>
            <TextInput
              style={styles.modalInput}
              value={newProduct.weight}
              onChangeText={(text) => setNewProduct((prev) => ({ ...prev, weight: text }))}
            />

            <Text style={styles.label}>Category</Text>
            <CategoryDropdown
              selected={newProduct.category}
              onSelect={(cat) => setNewProduct((prev) => ({ ...prev, category: cat }))}
            />

            {/* Image picker for Add */}
            <Text style={styles.label}>Product Image</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <TouchableOpacity style={styles.imagePickButton} onPress={pickNewProductImage}>
                <Ionicons name="image-outline" size={18} color="#C75D2C" />
                <Text style={{ color: '#C75D2C', marginLeft: 6 }}>Pick Image</Text>
              </TouchableOpacity>
            </View>
            {newProductImageUri ? (
              <Image source={{ uri: newProductImageUri }} style={styles.previewImage} />
            ) : null}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={saveNewProduct} style={{ flex: 1, marginRight: 5 }}>
                <LinearGradient colors={['#F8B259', '#D96F32']} style={styles.addButtonGradient}>
                  <Text style={styles.addButtonText}>Add Product</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setAddModalVisible(false);
                  setNewProductImageUri(null);
                }}
                style={[styles.addButtonGradient, { backgroundColor: '#C75D2C', flex: 1, marginLeft: 5 }]}
              >
                <Text style={styles.addButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Edit Product Modal */}
      <Modal animationType="slide" transparent={true} visible={editModalVisible}>
        <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            {selectedProduct && (
              <>
                {/* Existing image */}
                {selectedProduct.imageUrl ? (
                  <Image
                    source={{ uri: `${portLink()}${selectedProduct.imageUrl}` }}
                    style={styles.previewImage}
                  />
                ) : null}

                {/* Replacement picked image preview */}
                {editProductImageUri ? (
                  <>
                    <Text style={[styles.label, { marginTop: 8 }]}>New Image Preview</Text>
                    <Image source={{ uri: editProductImageUri }} style={styles.previewImage} />
                  </>
                ) : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <TouchableOpacity style={styles.imagePickButton} onPress={pickEditProductImage}>
                    <Ionicons name="image-outline" size={18} color="#C75D2C" />
                    <Text style={{ color: '#C75D2C', marginLeft: 6 }}>Replace Image</Text>
                  </TouchableOpacity>
                  {editProductImageUri ? (
                    <TouchableOpacity
                      style={[styles.imagePickButton, { marginLeft: 10 }]}
                      onPress={() => setEditProductImageUri(null)}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#C75D2C" />
                      <Text style={{ color: '#C75D2C', marginLeft: 6 }}>Remove New</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={selectedProduct.name}
                  onChangeText={(text) => setSelectedProduct((prev) => ({ ...prev, name: text }))}
                />

                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={String(selectedProduct.price)}
                  onChangeText={(text) =>
                    setSelectedProduct((prev) => ({ ...prev, price: Number(text) }))
                  }
                />

                <Text style={styles.label}>Discount</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={String(selectedProduct.discount)}
                  onChangeText={(text) =>
                    setSelectedProduct((prev) => ({ ...prev, discount: Number(text) }))
                  }
                />

                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={String(selectedProduct.quantity)}
                  onChangeText={(text) =>
                    setSelectedProduct((prev) => ({ ...prev, quantity: Number(text) }))
                  }
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.modalInput, { height: 80 }]}
                  multiline
                  value={selectedProduct.description}
                  onChangeText={(text) =>
                    setSelectedProduct((prev) => ({ ...prev, description: text }))
                  }
                />

                <Text style={styles.label}>Weight</Text>
                <TextInput
                  style={styles.modalInput}
                  value={selectedProduct.weight}
                  onChangeText={(text) =>
                    setSelectedProduct((prev) => ({ ...prev, weight: text }))
                  }
                />

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity onPress={saveChanges} style={{ flex: 1, marginRight: 5 }}>
                    <LinearGradient colors={['#F8B259', '#D96F32']} style={styles.addButtonGradient}>
                      <Text style={styles.addButtonText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditProductImageUri(null);
                    }}
                    style={[styles.addButtonGradient, { backgroundColor: '#C75D2C', flex: 1, marginLeft: 5 }]}
                  >
                    <Text style={styles.addButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={addCategoryModalVisible} animationType="slide">
        <LinearGradient colors={['#F3E9DC', '#F8B259', '#D96F32']} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category Name"
              placeholderTextColor="#D96F32"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={saveNewCategory} style={{ flex: 1, marginRight: 5 }}>
                <LinearGradient colors={['#F8B259', '#D96F32']} style={styles.addButtonGradient}>
                  <Text style={styles.addButtonText}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAddCategoryModalVisible(false)}
                style={[styles.addButtonGradient, { backgroundColor: '#C75D2C', flex: 1, marginLeft: 5 }]}
              >
                <Text style={styles.addButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topArea: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 233, 220, 0.8)',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    height: 45,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    color: '#C75D2C',
    fontSize: 16,
  },
  productCard: {
    backgroundColor: 'rgba(243, 233, 220, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(199, 93, 44, 0.2)',
  },
  productImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
  },
  editIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(248, 178, 89, 0.3)',
    padding: 8,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    bottom: 10,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(199, 93, 44, 0.2)',
  },
  productName: {
    color: '#C75D2C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    color: '#D96F32',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  productDiscount: {
    color: '#D96F32',
    fontSize: 14,
    marginTop: 2,
  },
  productQuantity: {
    color: '#C75D2C',
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  addButton: {
    marginBottom: 10,
  },
  logoutButton: {
    marginBottom: 10,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#F3E9DC',
    fontWeight: 'bold',
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(243, 233, 220, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 30,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    color: '#C75D2C',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: '#C75D2C',
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: 'rgba(248, 178, 89, 0.3)',
    color: '#C75D2C',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(199, 93, 44, 0.3)',
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 20,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownSolid: {
    backgroundColor: 'rgba(243, 233, 220, 0.95)',
    width: '80%',
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#C75D2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(199, 93, 44, 0.2)',
  },
  badge: {
    backgroundColor: '#C75D2C',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#F3E9DC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imagePickButton: {
    backgroundColor: 'rgba(248, 178, 89, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
  },
});
