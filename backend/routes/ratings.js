const express = require('express');
const router = express.Router();
const db = require('../config/firebase');

// POST /ratings/add → Add new rating (doc ID = productId)
router.post('/add', async (req, res) => {
  try {
    const { id, count, total } = req.body;

    if (!id || count == null || total == null) {
      return res.status(400).json({
        error: 'id, total and count are required'
      });
    }

    const data = {
      count,
      total,
      createdAt: new Date().toISOString(),
    };

    // create/overwrite rating document with productId = id
    await db.collection('rating').doc(id).set(data);

    res.status(201).json({ message: `Rating added for product ${id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /ratings/update/:id → Update rating by given productId
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { total, count } = req.body;

    const docRef = db.collection('rating').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: `No rating found with ID ${id}` });
    }

    const updatedData = {
      ...(total != null && { total }),
      ...(count != null && { count }),
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updatedData);

    res.status(200).json({ message: `Rating updated successfully for ${id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /ratings/:productId → Get rating for a product
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const doc = await db.collection('rating').doc(productId).get();

    if (!doc.exists) {
      return res.json({ rating: null, average: 0 });
    }

    const data = doc.data();
    const average = data.count > 0 ? (data.total / data.count).toFixed(2) : 0;

    res.json({
      rating: { id: doc.id, ...data },
      average
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /ratings/:id → Delete rating by productId
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('rating').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: `No rating found with ID ${id}` });
    }

    await docRef.delete();

    res.status(200).json({ message: `Rating deleted successfully for ${id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
