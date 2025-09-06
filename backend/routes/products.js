const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// -------------------- Multer setup --------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads')); // uploads folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // keep extension
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// -------------------- Routes --------------------

// GET all products
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('product').get();
    const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('product').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ error: `Product with ID ${id} not found` });

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET products by category
router.get('/by_category', async (req, res) => {
  try {
    const categoryId = req.query.category_id;

    let snapshot;
    if (categoryId) {
      snapshot = await db.collection('product').where('category_id', '==', categoryId).get();
    } else {
      snapshot = await db.collection('product').get();
    }

    const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add new product with optional image
router.post('/add', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const data = req.body;

    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`; // save relative path
    }

    const docRef = await db.collection('product').add(data);
    res.status(201).json({ id: docRef.id, imageUrl: data.imageUrl || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update product and optionally update image
router.put('/update/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const docRef = db.collection('product').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ error: `No product found with ID ${id}` });

    // If new image uploaded, delete old image from uploads folder
    if (req.file) {
      const oldImage = doc.data().imageUrl;
      if (oldImage) {
        const oldPath = path.join(__dirname, '..', oldImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); // delete old image
      }
      updatedData.imageUrl = `/uploads/${req.file.filename}`;
    }

    await docRef.update(updatedData);
    res.status(200).json({ message: `Product updated successfully`, imageUrl: updatedData.imageUrl || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE product by ID and remove image from uploads
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('product').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ error: `No product found with ID ${id}` });

    // Delete image file from uploads folder
    const product = doc.data();
    if (product.imageUrl) {
      const imagePath = path.join(__dirname, '..', product.imageUrl);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await docRef.delete();
    res.status(200).json({ message: `Product with ID ${id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
