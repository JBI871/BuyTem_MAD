const express = require('express');
const router = express.Router();
const db = require('../config/firebase');


// POST /orders/:user_id - Place an order from the user's cart
router.post('/', async (req, res) => {
  const { user_id, items, total, status, address_id, payment_id } = req.body;

  if (!user_id || !items || items.length === 0 || !total || !status || !address_id || !payment_id) {
    return res.status(400).json({ error: 'Missing required order fields' });
  }

  try {
    const newOrder = {
      user_id,
      items,
      total,
      status,
      address_id,
      payment_id,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('orders').add(newOrder);

    res.status(201).json({
      message: 'Order placed successfully',
      order_id: docRef.id,
      order: newOrder
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /orders - Get all orders (admin)
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('orders').get();
    const orders = snapshot.docs.map(doc => ({
      order_id: doc.id,
      ...doc.data()
    }));

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const snapshot = await db
      .collection('orders')
      .where('user_id', '==', user_id)
      .get();

    const orders = snapshot.docs.map(doc => ({
      order_id: doc.id,
      ...doc.data()
    }));

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
