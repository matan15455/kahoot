import express from 'express';
import User from '../models/User.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    /* =====================
       Validation
    ===================== */
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    /* =====================
       Check existing user
    ===================== */
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists"
      });
    }

    /* =====================
       Hash password
    ===================== */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* =====================
       Create user
    ===================== */
    const newUser = await User.create({
      username,
      password: hashedPassword,
      quizzesCreated: [],
      statistics: {
        totalPoints: 0,
        quizzesCreatedCount: 0,
        quizzesPlayedCount: 0
      }
    });

    /* =====================
       Response
    ===================== */
    res.status(201).json({
      message: "User registered successfully",
      user: {
        userId: newUser._id,
        username: newUser.username
      }
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1️⃣ בדיקת שדות
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    // 2️⃣ חיפוש משתמש
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // 3️⃣ השוואת סיסמאות (bcrypt)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // 4️⃣ יצירת JWT
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // תוקף טוקן
    );

    // 5️⃣ החזרת תשובה 
    res.json({
      token,
      user: {
        userId: user._id,
        username: user.username
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
