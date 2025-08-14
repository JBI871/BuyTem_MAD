const express = require('express');
const router = express.Router();
const db = require('../config/firebase'); 
const bcrypt = require('bcrypt');
const authenticateToken = require('../middleware/auth');

router.post('/auth/register', async (req, res) => {
  try {
    const data = req.body;
    const snapshot = await db.collection('users').where('email', '==', data.email).get();

    if (!snapshot.empty) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    if (!data.role) {
      data.role = 'customer';
    }
    if (!data.image) {
      data.image = '../../../assets/placeholderpp.png';
    }
    if (data.password) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }

    data.createdAt = new Date().toISOString();
    const docRef = await db.collection('users').add(data);

    res.status(201).json({ message: 'User created successfully', id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use(authenticateToken);


// GET /users/by_id/:id - get user by ID
router.get('/by_id/:id', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /users - get all users
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /users/:id - update user by ID
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRef.update(updateData);
    res.json({ message: `User ${userId} updated successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
