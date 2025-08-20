const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Function to generate 6-digit confirmation code
function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /confirmDelivery - create a confirmation
router.post('/', async (req, res) => {
  try {
    const { orderId, deliveryManId, customerId } = req.body;

    if (!orderId || !deliveryManId || !customerId) {
      return res.status(400).json({ error: 'orderId, deliveryManId, and customerId are required' });
    }

    const confirmationCode = generateConfirmationCode();

    const newDocRef = db.collection('confirmDelivery').doc();
    await newDocRef.set({
      orderId,
      deliveryManId,
      customerId,
      confirmationCode,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'confirmed', id: newDocRef.id});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

// GET /confirmDelivery/:orderId - get confirmation by orderId
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const snapshot = await db
      .collection('confirmDelivery')
      .where('orderId', '==', orderId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Confirmation not found' });
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch confirmation' });
  }
});

// DELETE /confirmDelivery/:orderId - delete confirmation by orderId
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const snapshot = await db
      .collection('confirmDelivery')
      .where('orderId', '==', orderId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Confirmation not found' });
    }

    const docId = snapshot.docs[0].id;
    await db.collection('confirmDelivery').doc(docId).delete();

    res.json({ message: 'Confirmation deleted successfully', id: docId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete confirmation' });
  }
});


module.exports = router;
