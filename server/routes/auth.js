import express from 'express';
import User from '../models/User.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(\+972|0)?5\d{8}$/; 


// הרשמה
router.post("/register", async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, phone, birthday } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "נדרשים שם משתמש וסיסמה"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "סיסמה חייבת להיות בת לפחות 6 ספרות"
      });
    }

    if (email && !emailRegex.test(email)) {
      return res.status(400).json({
        message: "אימייל לא תקין"
      });
    }

    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({
        message: "מספר טלפון לא תקין"
      });
    }

    if (birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();

      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          message: "תאריך לידה לא תקין"
        });
      }

      if (birthDate > today) {
        return res.status(400).json({
          message: "תאריך לידה לא יכול להיות עתידי"
        });
      }
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        message: "המשתמש כבר קיים במערכת"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

      res.status(201).json({
        message: "משתמש נרשם בהצלחה",
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
        message: "נדרשים שם משתמש וסיסמה"
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        message: "המשתמש לא קיים במערכת"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "סיסמה לא תקינה"
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
