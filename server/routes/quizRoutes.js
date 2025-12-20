import express from 'express';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { title, description, creatorId, questions } = req.body;

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

    res.status(201).json({ message: 'Quiz created successfully', quizId: quiz._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get("/my/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("quizzesCreated");

    res.json(user.quizzesCreated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
