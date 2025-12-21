import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import quizRoutes from './routes/quizRoutes.js';
import authRoutes from './routes/auth.js'; // כאן נייבא את ה-router של Auth

import initSocket from './socket.js';
import http from 'http';

dotenv.config(); // טוען משתני סביבה

// חיבור ל-MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// ROUTES
app.use('/auth', authRoutes); // מחברים את ה-Auth router
app.use('/quizzes', quizRoutes);


app.get('/', (req, res) => {
  res.send('Server is running');
});

const server = http.createServer(app);
initSocket(server);

// PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

