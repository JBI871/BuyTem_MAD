const express = require('express');
const router = express.Router();
const db = require('../config/firebase');

// POST /cart - Add or update one item in user's cart
// POST /cart - Add a new cart item
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

    // Calculate discounted price if discount > 0
    const finalPrice = product.discount && product.discount > 0
      ? product.price - product.discount * 0.01 * product.price
      : product.price;

    // Create cart item
    const newCart = {
      user_id,
      product_id,
      product_name: product.name,
      product_price: parseFloat(finalPrice.toFixed(2)), // discounted price if applicable
      quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cartRef = db.collection('carts');
    await cartRef.add(newCart);

    res.status(201).json({ message: 'Cart created', cart: newCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// GET /cart/:user_id - Fetch cart with total
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    // Query all cart items for this user
    const cartQuery = await db.collection('carts').where('user_id', '==', user_id).get();

    // Map cart items
    const items = cartQuery.docs.map(doc => {
      const data = doc.data();
      return {
        product_id: data.product_id,
        product_name: data.product_name,
        product_price: data.product_price,
        quantity: data.quantity,
        discount: data.discount || 0,
        item_total: (data.product_price - (data.discount || 0) * 0.01 * data.product_price) * data.quantity,
      };
    });

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.item_total, 0);

    // Return response (empty cart is okay)
    res.json({
      user_id,
      items, // will be [] if no items
      total, // will be 0 if no items
    });
  } catch (error) {
    console.error(error);
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
    // Find the cart item document
    const cartQuery = await db
      .collection('carts')
      .where('user_id', '==', user_id)
      .where('product_id', '==', product_id)
      .get();

    if (cartQuery.empty) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    const cartDoc = cartQuery.docs[0];
    const cartRef = db.collection('carts').doc(cartDoc.id);

    if (quantity === 0) {
      // Remove the product
      await cartRef.delete();
      return res.json({ message: 'Cart item removed' });
    } else {
      // Update the quantity
      await cartRef.update({
        quantity,
        updatedAt: new Date().toISOString(),
      });
      return res.json({ message: 'Cart item updated', product_id, quantity });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const cartQuery = await db
      .collection('carts')
      .where('user_id', '==', user_id)
      .get();

    if (cartQuery.empty) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Delete all cart items for the user
    const batch = db.batch();
    cartQuery.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ message: `Cart for user ${user_id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});






module.exports = router;
