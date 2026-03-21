const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const reminderRoutes = require('./routes/reminders');
const messageRoutes = require('./routes/messages');
const repairRoutes = require('./routes/repairs');
const paymentRoutes = require('./routes/payments');
const leaseRoutes = require('./routes/leases');
const suggestionRoutes = require('./routes/suggestions');
const authMiddleware = require('./middleware/auth');

// Middleware
app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route
app.get('/', (req, res) => {
  res.send('Apex Agencies Backend API is running...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', authMiddleware, propertyRoutes);
app.use('/api', authMiddleware, reminderRoutes);
app.use('/api', authMiddleware, messageRoutes);
app.use('/api', authMiddleware, repairRoutes);
app.use('/api', authMiddleware, paymentRoutes);
app.use('/api', authMiddleware, leaseRoutes);
app.use('/api', authMiddleware, suggestionRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
