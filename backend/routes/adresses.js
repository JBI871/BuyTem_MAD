const express = require('express');
const router = express.Router();
const db = require('../config/firebase'); // your Firestore instance

// POST /addresses - add a new address
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    data.createdAt = new Date().toISOString();

    const docRef = await db.collection('addresses').add(data);
    res.status(201).json({ message: 'Address added', id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /addresses/user/:userId - get addresses by user_id
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const snapshot = await db.collection('addresses')
      .where('user_id', '==', userId)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No addresses found for this user' });
    }

    const addresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /addresses/:id - update address by ID
router.put('/:id', async (req, res) => {
  try {
    const addressId = req.params.id;
    const updateData = req.body;

    const addressRef = db.collection('addresses').doc(addressId);
    const doc = await addressRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await addressRef.update(updateData);
    res.json({ message: 'Address updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /addresses/:id - delete address by ID
router.delete('/:id', async (req, res) => {
  try {
    const addressId = req.params.id;

    const addressRef = db.collection('addresses').doc(addressId);
    const doc = await addressRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await addressRef.delete();
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /addresses/user/:userId/:addressId - get a specific address by user_id and address id
router.get('/user/:userId/:addressId', async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const addressRef = db.collection('addresses').doc(addressId);
    const doc = await addressRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const addressData = doc.data();

    if (addressData.user_id !== userId) {
      return res.status(403).json({ error: 'Address does not belong to this user' });
    }

    res.json({ id: doc.id, ...addressData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /addresses/addressId
router.get('/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;

    const addressRef = db.collection('addresses').doc(addressId);
    const doc = await addressRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'address not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching address by ID:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
});

module.exports = router;
