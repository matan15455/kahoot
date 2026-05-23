import express from "express";
import GameSession from "../models/GameSession.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// כל המשחקים שהמשתמש הפעיל
router.get("/my-sessions", authMiddleware, async (req, res) => {
  try {
    const sessions = await GameSession.find({ hostId: req.user.mongoId })
      .sort({ createdAt: -1 })
      .select("quizId quizTitle createdAt players questions");

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// משחק ספציפי
router.get("/:sessionId", authMiddleware, async (req, res) => {
  try {
    const session = await GameSession.findOne({
      _id:    req.params.sessionId,
      hostId: req.user.mongoId       // רק המנחה שלו רואה
    });

    if (!session) return res.status(404).json({ message: "לא נמצא" });

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;