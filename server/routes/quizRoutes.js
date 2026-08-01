import express from 'express';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

//שמירת חידון 
router.post('/',authMiddleware, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    const creatorId = req.user.mongoId; // ObjectId של Mongo

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

    res.status(201).json({
      message: "Quiz created successfully",
      quizId: quiz._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// קבלת החידונים שהמשתמש יצר
router.get("/my", authMiddleware, async (req, res) => {
  try {
    // מגיע מה-JWT
    const userId = req.user.mongoId;

    const quizzes = await Quiz.find({ creatorId: userId })
    .sort({ createdAt: -1 });

    res.json(quizzes);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:quizId", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.quizId,
      creatorId: req.user.mongoId
    });

    if (!quiz) return res.status(404).json({ message: "חידון לא נמצא" });

    await Question.deleteMany({ _id: { $in: quiz.questions } });
    await quiz.deleteOne();

    res.json({ message: "החידון נמחק" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
