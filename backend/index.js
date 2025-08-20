require('dotenv').config();
const express = require('express');
const cors = require('cors');

const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');
const usersRouter = require('./routes/users');
const addressesRouter = require('./routes/adresses');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const paymentRouter = require('./routes/payment');
const authRouter = require('./routes/auth');
const confirmDelivery = require('./routes/confirmDeliver');
const ratings=require('./routes/ratings');
const authenticateToken = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 6000; // ✅ Define PORT

// Public routes
app.use('/categories', categoriesRouter);
app.use('/products', productsRouter);
app.use('/ratings',ratings);
app.use('/auth', authRouter);
app.use('/users', usersRouter);

// Protected routes
app.use('/addresses', authenticateToken, addressesRouter);
app.use('/cart', authenticateToken, cartRouter);
app.use('/orders', authenticateToken, ordersRouter);
app.use('/payment', authenticateToken, paymentRouter);
app.use('/confirmDelivery',authenticateToken,confirmDelivery)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
