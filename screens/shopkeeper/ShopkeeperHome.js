import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Modal, Alert, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { portLink } from '../../navigation/AppNavigation';
import { useNavigation } from '@react-navigation/native';



export default function ShopkeeperHome({ setUserRole }) {
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchPendingCount();
  }, []);


  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openEditModal = (product) => {
    setSelectedProduct({ ...product });
    setEditModalVisible(true);
  };

  const saveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = { ...selectedProduct, category: selectedProduct.category.id };
      const response = await fetch(`${portLink()}/products/update/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  const removeProduct = async (id) => {
    Alert.alert(
      'Remove Product',
      'Are you sure you want to remove this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${portLink()}/products/delete/${id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (!response.ok) throw new Error('Failed to remove product');
              await fetchProducts();
              Alert.alert('Success', 'Product removed successfully');
            } catch (error) {
              console.error('Remove product error:', error);
              Alert.alert('Error', 'Failed to remove product.');
            }
          }
        }
      ]
    );
  };

  const saveNewProduct = async () => {
    if (!newProduct.category) {
      Alert.alert('Error', 'Please select a category.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = { ...newProduct, category: newProduct.category.id };
      const response = await fetch(`${portLink()}/products/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to add product');
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
      Alert.alert('Success', 'Product added successfully');
    } catch (error) {
      console.error('Add product error:', error);
      Alert.alert('Error', 'Failed to add product.');
    }
  };

  const saveNewCategory = async () => {
    if (!newCategoryName.trim()) return Alert.alert('Error', 'Category name cannot be empty');
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${portLink()}/categories/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

  const CategoryDropdown = ({ selected, onSelect }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <TouchableOpacity
        style={[styles.modalInput, { flex: 1, justifyContent: 'center' }]}
        onPress={() => setCategoryDropdownVisible(true)}
      >
        <Text style={{ color: '#fff' }}>{selected ? selected.category_name : 'Select Category'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modalInput, { width: 45, marginLeft: 8, justifyContent: 'center', alignItems: 'center', padding: 0 }]}
        onPress={() => setAddCategoryModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </TouchableOpacity>

      <Modal transparent visible={categoryDropdownVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setCategoryDropdownVisible(false)}>
          <View style={styles.dropdownOverlay}>
            <View style={styles.dropdownSolid}>
              <ScrollView>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => { onSelect(cat); setCategoryDropdownVisible(false); }}
                    style={styles.dropdownItem}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{cat.category_name}</Text>
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>Price: ৳{item.price}</Text>
              <Text style={styles.productDiscount}>Discount: {item.discount}%</Text>
              <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>

              <TouchableOpacity style={styles.editIcon} onPress={() => openEditModal(item)}>
                <Ionicons name="create-outline" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.removeButton} onPress={() => removeProduct(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Bottom Buttons */}

      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AdminOrder')}
        >
          <LinearGradient colors={['#ae273bff', '#e19c07ff']} style={styles.addButtonGradient}>
            <Ionicons name="reader" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>Orders</Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>



        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.addButtonGradient}>
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add New Product</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            // 1️⃣ Clear token
            await AsyncStorage.removeItem('token');

            // 2️⃣ Clear user state
            setUserRole(null);
            setUserEmail(null);

            // 3️⃣ Reset navigation to Home
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }}
        >
          <LinearGradient colors={['#c0392b', '#e74c3c']} style={styles.addButtonGradient}>
            <Text style={styles.addButtonText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>


      {/* Add Product Modal */}
      <Modal animationType="slide" transparent={true} visible={addModalVisible}>
        <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Product</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.modalInput} value={newProduct.name} onChangeText={(text) => setNewProduct(prev => ({ ...prev, name: text }))} />

            <Text style={styles.label}>Price</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={String(newProduct.price)} onChangeText={(text) => setNewProduct(prev => ({ ...prev, price: Number(text) }))} />

            <Text style={styles.label}>Discount</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={String(newProduct.discount)} onChangeText={(text) => setNewProduct(prev => ({ ...prev, discount: Number(text) }))} />

            <Text style={styles.label}>Quantity</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={String(newProduct.quantity)} onChangeText={(text) => setNewProduct(prev => ({ ...prev, quantity: Number(text) }))} />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.modalInput, { height: 80 }]} multiline value={newProduct.description} onChangeText={(text) => setNewProduct(prev => ({ ...prev, description: text }))} />

            <Text style={styles.label}>Weight</Text>
            <TextInput style={styles.modalInput} value={newProduct.weight} onChangeText={(text) => setNewProduct(prev => ({ ...prev, weight: text }))} />

            <Text style={styles.label}>Category</Text>
            <CategoryDropdown selected={newProduct.category} onSelect={(cat) => setNewProduct(prev => ({ ...prev, category: cat }))} />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={saveNewProduct} style={{ flex: 1, marginRight: 5 }}>
                <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.addButtonGradient}>
                  <Text style={styles.addButtonText}>Add Product</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={[styles.addButtonGradient, { backgroundColor: '#e74c3c', flex: 1, marginLeft: 5 }]}>
                <Text style={styles.addButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Edit Product Modal */}
      <Modal animationType="slide" transparent={true} visible={editModalVisible}>
        <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            {selectedProduct && (
              <>
                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.modalInput} value={selectedProduct.name} onChangeText={(text) => setSelectedProduct(prev => ({ ...prev, name: text }))} />

                <Text style={styles.label}>Price</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={String(selectedProduct.price)} onChangeText={(text) => setSelectedProduct(prev => ({ ...prev, price: Number(text) }))} />

                <Text style={styles.label}>Discount</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={String(selectedProduct.discount)} onChangeText={(text) => setSelectedProduct(prev => ({ ...prev, discount: Number(text) }))} />

                <Text style={styles.label}>Quantity</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={String(selectedProduct.quantity)} onChangeText={(text) => setSelectedProduct(prev => ({ ...prev, quantity: Number(text) }))} />

                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.modalInput, { height: 80 }]} multiline value={selectedProduct.description} onChangeText={(text) => setSelectedProduct(prev => ({ ...prev, description: text }))} />

                <Text style={styles.label}>Weight</Text>
                <TextInput style={styles.modalInput} value={selectedProduct.weight} onChangeText={(text) => setSelectedProduct(prev => ({ ...prev, weight: text }))} />



                <View style={styles.modalButtonRow}>
                  <TouchableOpacity onPress={saveChanges} style={{ flex: 1, marginRight: 5 }}>
                    <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.addButtonGradient}>
                      <Text style={styles.addButtonText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setEditModalVisible(false)} style={[styles.addButtonGradient, { backgroundColor: '#e74c3c', flex: 1, marginLeft: 5 }]}>
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
        <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category Name"
              placeholderTextColor="#ccc"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={saveNewCategory} style={{ flex: 1, marginRight: 5 }}>
                <LinearGradient colors={['#3a6b35', '#2c4f25']} style={styles.addButtonGradient}>
                  <Text style={styles.addButtonText}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAddCategoryModalVisible(false)} style={[styles.addButtonGradient, { backgroundColor: '#e74c3c', flex: 1, marginLeft: 5 }]}>
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
  container: { flex: 1 },
  topArea: { paddingTop: 20, paddingBottom: 10 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, marginHorizontal: 20, paddingHorizontal: 10, height: 45 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  productCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 15, marginBottom: 12, position: 'relative' },
  editIcon: { position: 'absolute', top: 10, right: 10 },
  removeButton: { position: 'absolute', bottom: 10, right: 6, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  productName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  productPrice: { color: '#fff', fontSize: 14, marginTop: 4 },
  productDiscount: { color: '#fff', fontSize: 14, marginTop: 2 },
  productQuantity: { color: '#fff', fontSize: 14, marginTop: 2 },
  bottomArea: { position: 'absolute', bottom: 20, width: '100%', paddingHorizontal: 20 },
  addButton: { marginBottom: 10 },
  logoutButton: { marginBottom: 10 },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  modalContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 20, marginVertical: 30 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { color: '#fff', fontSize: 14, marginBottom: 6 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 10 },
  modalButtonRow: { flexDirection: 'row', marginTop: 5, marginBottom: 20 },
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownSolid: { backgroundColor: 'rgba(255,255,255,0.05)', width: '80%', borderRadius: 10, maxHeight: 300 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  badge: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

});
