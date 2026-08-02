import express from 'express';
import User from '../models/User.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

const usernameRegex = /^[a-zA-Zא-ת0-9]{3,20}$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

// הרשמה
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "נדרשים שם משתמש וסיסמה"
      });
    }

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: "שם משתמש צריך להיות 3-20 תווים, אותיות וספרות בלבד"
      });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "הסיסמה חייבת להכיל לפחות 8 תווים, אות אחת וספרה אחת"
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        message: "המשתמש כבר קיים במערכת"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword
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

// התחברות
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
        mongoId: user._id,      // ObjectId פנימי
        username: user.username // שם המשתמש
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // תוקף טוקן
    );

    //  החזרת תשובה 
    return res.status(200).json({
      message: "התחברות הצליחה",
      token
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;