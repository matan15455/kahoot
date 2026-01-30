import express from 'express';
import User from '../models/User.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();


// הרשמה
router.post("/register", async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, phone, birthday } = req.body;

    if (!username || !password || !firstName || !lastName || !email || !phone || !birthday) {
      return res.status(400).json({
        message: "חסרה אחת מהשדות"
      });
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
      message: "משתמש נרשם בהצלחה"
    });
  } 
  catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/login", async (req, res) => {
  try {
    const { username, password } = req.query;

    if (!username || !password) {
      return res.status(400).json({
        message: "נדרשים שם משתמש וסיסמה"
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
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
    return res.status(200).json({
      message: "התחברות הצליחה",
      token,
      user: { userId: user._id, username: user.username }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
