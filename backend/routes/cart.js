const express = require('express');
const router = express.Router();
const db = require('../config/firebase');

// POST /cart - Add or update one item in user's cart
router.post('/', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || typeof quantity !== 'number') {
    return res.status(400).json({ error: 'user_id, product_id and quantity are required' });
  }

  try {
    // Fetch product info
    const productDoc = await db.collection('product').doc(product_id).get();

    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productDoc.data();

    const cartRef = db.collection('carts').doc(user_id);
    const cartDoc = await cartRef.get();
    let currentItems = [];

    if (cartDoc.exists) {
      currentItems = cartDoc.data().items || [];
    }

    const index = currentItems.findIndex(item => item.product_id === product_id);
    if (index >= 0) {
      currentItems[index].quantity += quantity;
    } else {
      currentItems.push({
        product_id,
        product_name: product.name,
        product_price: product.price,
        quantity,
      });
    }

    await cartRef.set({
      user_id,
      items: currentItems,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: 'Item added to cart', cart: currentItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /cart/:user_id - Fetch cart with total
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const cartDoc = await db.collection('carts').doc(user_id).get();

    if (!cartDoc.exists) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const data = cartDoc.data();
    const items = data.items || [];

    const enrichedItems = items.map(item => ({
      ...item,
      item_total: (item.product_price-(item.discount*0.01)) * item.quantity,
    }));

    const total = enrichedItems.reduce((sum, item) => sum + item.item_total, 0);

    res.json({
      user_id, 
      items: enrichedItems,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:user_id/:product_id', async (req, res) => {
  const { user_id, product_id } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== 'number') {
    return res.status(400).json({ error: 'Quantity must be a number' });
  }

  try {
    const cartRef = db.collection('carts').doc(user_id);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    let items = cartDoc.data().items || [];
    const index = items.findIndex(item => item.product_id === product_id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    if (quantity === 0) {
      // Remove the product from cart
      items.splice(index, 1);
    } else {
      // Update the quantity
      items[index].quantity = quantity;
    }

    await cartRef.set({
      user_id,
      items,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: quantity === 0 ? 'Cart item removed' : 'Cart item updated', cart: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const cartRef = db.collection('carts').doc(user_id);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    await cartRef.delete();

    res.json({ message: `Cart for user ${user_id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
