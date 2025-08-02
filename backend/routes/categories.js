const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const authenticateToken = require('../middleware/auth');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('category').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add new category
router.post('/add',authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection('category').add(data);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
