import express from 'express';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/',authMiddleware, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    const creatorId = req.user.userId;

    // יוצרים את השאלות ומכניסים למסד
    const questionDocs = await Question.insertMany(questions);

    // יוצרים את החידון עם השאלות
    const quiz = new Quiz({
      title,
      description,
      creatorId,
      questions: questionDocs.map(q => q._id)
    });

    await quiz.save();

    // מוסיפים את החידון לרשימת החידונים של המשתמש
    await User.findByIdAndUpdate(creatorId, {
      $push: { quizzesCreated: quiz._id },
      $inc: { 'statistics.quizzesCreatedCount': 1 }
    });

    res.status(201).json({
      message: "Quiz created successfully",
      quizId: quiz._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    // מגיע מה-JWT
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .populate("quizzesCreated");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.quizzesCreated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
