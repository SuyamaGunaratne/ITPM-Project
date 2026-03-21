const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const dns = require('node:dns/promises');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = express();

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  })
);
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const boardingRoutes = require('./routes/boardingRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/boardings', boardingRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
console.log('Attempting MongoDB connection to:', process.env.MONGO_URI?.split('@')[0] || 'unknown URL');
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✓ MongoDB Connected Successfully");
})
.catch((err) => {
  console.error("❌ MongoDB Connection Failed:", err.message);
  process.exit(1);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.send("Server is running...");
});