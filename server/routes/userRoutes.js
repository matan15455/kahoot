import express from 'express';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js'; 
import bcrypt from "bcrypt";
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;

  // רק המשתמש עצמו יכול לראות את הנתונים שלו
  if (req.user.username !== username) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      return res.status(404).json({ message: "משתמש לא נמצא בבסיס נתונים" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.patch("/:username", authMiddleware, async (req, res) => {
  const { username } = req.params;
  const updates = req.body;

  // רק המשתמש עצמו יכול לעדכן את הנתונים שלו
  if (req.user.username !== username) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "חסר אלמנטים בגוף הבקשה" });
  }

  // רשימת שדות שמותר לעדכן
  const allowedFields = ["password"];

  // בדיקה אם יש שדות לא חוקיים
  const invalidFields = Object.keys(updates).filter(
    key => !allowedFields.includes(key)
  );
  if (invalidFields.length > 0) {
    return res.status(400).json({ message: `שדות לא חוקיים: ${invalidFields.join(", ")}` });
  }

  // ולידציה לשדה הסיסמה
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (updates.password && !passwordRegex.test(updates.password)) {
    return res.status(400).json({ message: "סיסמה לא עומדת בדרישות הבטיחות" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "שם משתמש לא קיים במערכת" });
    }

    // עדכון השדות החוקיים בלבד
    for (const key of Object.keys(updates)) {
      if (key === "password") {
        // הצפנת הסיסמה לפני שמירה
        const hashedPassword = await bcrypt.hash(updates.password, 10);
        user.password = hashedPassword;
      } else {
        user[key] = updates[key];
      }
    }

    await user.save();
    res.status(200).json({ message: "משתמש עודכן בהצלחה", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


router.delete('/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;

  // רק המשתמש עצמו יכול למחוק את החשבון שלו
  if (req.user.username !== username) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "משתמש לא קיים במערכת" });
    }

    // מחיקת חידונים שיצר המשתמש
    await Quiz.deleteMany({ creatorId: user._id });

    // מחיקת המשתמש עצמו
    await user.deleteOne();

    res.status(200).json({ message: "משתמש והמידע הקשור אליו נמחקו" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;