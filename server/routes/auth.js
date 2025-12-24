import express from 'express';
import User from '../models/User.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

/* =====================
   Validation helpers
===================== */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(\+972|0)?5\d{8}$/; 


// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, phone, birthday } = req.body;

    /* =====================
       Basic validation
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
       Email validation
    ===================== */
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    /* =====================
       Phone validation
    ===================== */
    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number"
      });
    }

    /* =====================
       Birthday validation
    ===================== */
    if (birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();

      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          message: "Invalid birthday date"
        });
      }

      if (birthDate > today) {
        return res.status(400).json({
          message: "Birthday cannot be in the future"
        });
      }
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
      firstName,
      lastName,
      email,
      phone,
      birthday,
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
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      });
  } 
  catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    //  יצירת JWT
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // תוקף טוקן
    );

    //  החזרת תשובה 
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
