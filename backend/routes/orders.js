const express = require('express');
const router = express.Router();
const db = require('../config/firebase');

// POST /orders - Place an order from the user's cart
router.post('/', async (req, res) => {
  const { user_id, items, total, status, address_id, payment_id, tip } = req.body;

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
      tip,
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

// GET /orders/:user_id - Get orders of a user, sorted client-side
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const snapshot = await db
      .collection('orders')
      .where('user_id', '==', user_id)
      .get();

    let orders = snapshot.docs.map(doc => ({
      order_id: doc.id,
      ...doc.data()
    }));

    // Sort by createdAt descending (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /orders/:order_id - Update an order (e.g., status)
router.put('/:order_id', async (req, res) => {
  const { order_id } = req.params;
  const { status, deliveryManId } = req.body; // receive deliveryManId

  if (!status || !['Pending', 'Accepted', 'Denied', 'Picked Up', 'Delivered'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const orderRef = db.collection('orders').doc(order_id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData = { status };

    // Only add deliveryManId if provided
    if (deliveryManId) {
      updateData.deliveryManId = deliveryManId;
    }

    await orderRef.update(updateData);

    res.json({
      message: `Order ${order_id} updated successfully`,
      order_id,
      status,
      deliveryManId: updateData.deliveryManId || null
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});


// GET /orders/pending-count - Get number of orders with status "Pending"
router.get('/pending_count', async (req, res) => {
  try {
    const snapshot = await db
      .collection('orders')
      .where('status', '==', 'Pending')
      .get();

    const pendingCount = snapshot.size; // Number of documents matching the query

    res.json({ pendingCount });
  } catch (error) {
    console.error('Error fetching pending orders count:', error);
    res.status(500).json({ error: 'Failed to get pending orders count' });
  }
});

// GET /orders/accepted - Get all pending orders

router.get('/accepted', async (req, res) => {
  try {
    const snapshot = await db
      .collection('orders')
      .where('status', '==', 'Accepted')
      .get();

    if (snapshot.empty) {
      console.log('No accepted orders found');
      return res.json({ pendingCount: 0, orders: [] });
    }

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ pendingCount: snapshot.size, orders });
  } catch (error) {
    console.error('Error fetching accepted orders:', error);
    res.status(500).json({ error: 'Failed to get accepted orders count' });
  }
});


router.get('/status/:status', async (req, res) => {
  const { status } = req.params;
  try {
    const snapshot = await db
      .collection('orders')
      .where('status', '==', status)
      .get();

    if (snapshot.empty) {
      console.log('No accepted orders found');
      return res.json({ pendingCount: 0, orders: [] });
    }

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ pendingCount: snapshot.size, orders });
  } catch (error) {
    console.error('Error fetching accepted orders:', error);
    res.status(500).json({ error: 'Failed to get accepted orders count' });
  }
});


// GET /orders/delivery/:id
router.get('/delivery/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const snapshot = await db
      .collection('orders')
      .where('status', '==', 'Picked Up')
      .get();

    // Filter client-side to include only orders where deliveryManId exists and matches :id
    const orders = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(order => order.deliveryManId && order.deliveryManId === id);

    res.json({ count: orders.length, orders });
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    res.status(500).json({ error: 'Failed to fetch delivery orders' });
  }
});



module.exports = router;
