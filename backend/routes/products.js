const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const authenticateToken = require('../middleware/auth');


// GET all products
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('product').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /products/:id - Fetch single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('product').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: `Product with ID ${id} not found` });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//GET /product?category_id=abc123
router.get('/by_category', async (req, res) => {
  try {
    const categoryId = req.query.category_id;

    let snapshot;
    if (categoryId) {
      snapshot = await db
        .collection('product')
        .where('category_id', '==', categoryId)
        .get();
    } else {
      snapshot = await db.collection('product').get();
    }

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// POST add new product
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection('product').add(data);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /products/delete/:id
router.delete('/delete/:id', authenticateToken,async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('product').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: `No product found with ID ${id}` });
    }

    await docRef.delete();
    res.status(200).json({ message: `Product with ID ${id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /products/update/:id
router.put('/update/:id', authenticateToken,async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const docRef = db.collection('product').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: `No product found with ID ${id}` });
    }

    await docRef.update(updatedData);
    res.status(200).json({ message: `Product with ID ${id} updated successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
