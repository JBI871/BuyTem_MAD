const express = require('express');
const router = express.Router();
const db = require('../config/firebase');

// POST /payment - create a new payment
router.post('/', async (req, res) => {
  const { user_id, payment_method, payment_credential } = req.body;

  if (!user_id || !payment_method || !payment_credential) {
    return res.status(400).json({ error: 'user_id, payment_method, and payment_credential are required' });
  }

  try {
    const data = {
      user_id,
      payment_method,
      payment_credential,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('payments').add(data);

    res.status(201).json({ message: 'Payment created successfully', payment_id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /payment/:user_id - get all payments of a user
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const snapshot = await db.collection('payments').where('user_id', '==', user_id).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No payments found for this user' });
    }

    const payments = snapshot.docs.map(doc => ({ payment_id: doc.id, ...doc.data() }));

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /payment/:user_id/:payment_id - get specific payment of a user
router.get('/:user_id/:payment_id', async (req, res) => {
  const { user_id, payment_id } = req.params;

  try {
    const paymentDoc = await db.collection('payments').doc(payment_id).get();

    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const paymentData = paymentDoc.data();

    if (paymentData.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized access to this payment' });
    }

    res.json({ payment_id: paymentDoc.id, ...paymentData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /payment/:user_id/:payment_id - delete a specific payment of a user
router.delete('/:user_id/:payment_id', async (req, res) => {
  const { user_id, payment_id } = req.params;

  try {
    const paymentDoc = await db.collection('payments').doc(payment_id).get();

    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const paymentData = paymentDoc.data();

    if (paymentData.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized to delete this payment' });
    }

    await db.collection('payments').doc(payment_id).delete();

    res.json({ message: `Payment ${payment_id} deleted for user ${user_id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
