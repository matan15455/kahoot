import express from 'express';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js'; 
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  // רק המשתמש עצמו יכול לראות את הנתונים שלו
  if (req.user.id !== id) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const user = await User.findOne({ id }).populate('quizzesCreated');
    if (!user) {
      return res.status(404).json({ message: "משתמש לא נמצא בבסיס נתונים" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.patch('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // רק המשתמש עצמו יכול לעדכן את הנתונים שלו
  if (req.user.id !== id) {
    return res.status(403).json({ message: "Access denied" });
  }

  // אסור לעדכן ת.ז.
  if ("id" in updates) {
    return res.status(400).json({ message: "אסור לעדכן ת.ז." });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "חסר אלמנטים בגוף הבקשה" });
  }

  try {
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(400).json({ message: "ת.ז. לא קיימת במערכת" });
    }

    Object.keys(updates).forEach(key => {
      user[key] = updates[key];
    });

    await user.save();
    res.status(200).json({ message: "משתמש עודכן בהצלחה", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  // רק המשתמש עצמו יכול למחוק את החשבון שלו
  if (req.user.id !== id) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const user = await User.findOne({ id });
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
