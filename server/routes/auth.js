import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // בדיקה אם המשתמש כבר קיים
    const existingUser = await User.findOne({ username });
    if (existingUser)
        return res.status(400).json({ message: 'Username already exists' });

    // יצירת משתמש חדש
    const user = new User({
      username,
      password,
      quizzesCreated: [],
      statistics: {
        totalPoints: 0,
        quizzesCreatedCount: 0,
        quizzesPlayedCount: 0
      }
    });
    await user.save();

    res.status(201).json({ message: 'User created successfully', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // מוצאים את המשתמש
    const user = await User.findOne({ username });
    if (!user)
         return res.status(400).json({ message: 'Invalid username or password' });

    // בודקים סיסמה
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
         return res.status(400).json({ message: 'Invalid username or password' });

    res.json({ message: 'Login successful', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
