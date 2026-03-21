import express from 'express';
import Gamesession from '../models/Gamesession.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// כל ה-routes מוגנים
router.use(authMiddleware);

/* =====================================================
   GET /stats/user  — Personal Dashboard
===================================================== */
router.get('/user', async (req, res) => {
  try {
    const hostId = req.user.mongoId;

    // כל sessions שהמשתמש היה host
    const sessions = await Gamesession.find({ hostId })
      .sort({ playedAt: -1 })
      .lean();

    // סה"כ שחקנים ייחודיים
    const totalPlayersAll = sessions.reduce((sum, s) => sum + s.totalPlayers, 0);

    // ממוצע שחקנים לסשן
    const avgPlayers = sessions.length
      ? (totalPlayersAll / sessions.length).toFixed(1)
      : 0;

    // פעילות לאורך זמן — קיבוץ לפי שבוע (30 שבועות אחרונים)
    const activityMap = {};
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const key = weekKey(d);
      activityMap[key] = 0;
    }

    sessions.forEach(s => {
      const key = weekKey(new Date(s.playedAt));
      if (activityMap[key] !== undefined) activityMap[key]++;
    });

    const activityChart = Object.entries(activityMap).map(([week, count]) => ({
      week,
      count
    }));

    // חידונים שיצר
    const quizCount = await Quiz.countDocuments({ creatorId: hostId });

    res.json({
      totalSessions: sessions.length,
      totalPlayers: totalPlayersAll,
      avgPlayersPerSession: avgPlayers,
      totalQuizzes: quizCount,
      activityChart,
      recentSessions: sessions.slice(0, 5).map(s => ({
        id: s._id,
        quizTitle: s.quizTitle,
        totalPlayers: s.totalPlayers,
        playedAt: s.playedAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =====================================================
   GET /stats/quiz/:quizId  — Per Quiz Stats
===================================================== */
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;

    const sessions = await Gamesession.find({ quizId })
      .sort({ playedAt: -1 })
      .lean();

    if (!sessions.length) {
      return res.json({ sessions: 0, message: 'אין נתונים עדיין' });
    }

    // ממוצע ניקוד לאורך כל הסשנים
    const allScores = sessions.flatMap(s => s.players.map(p => p.score));
    const avgScore = allScores.length
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    // אחוז נכון לכל שאלה (ממוצע בין כל הסשנים)
    const questionMap = {};
    sessions.forEach(s => {
      s.questionStats.forEach(q => {
        if (!questionMap[q.questionText]) {
          questionMap[q.questionText] = { correct: 0, total: 0 };
        }
        questionMap[q.questionText].correct += q.correctCount;
        questionMap[q.questionText].total += q.totalAnswers;
      });
    });

    const questionChart = Object.entries(questionMap).map(([text, data]) => ({
      question: text.length > 40 ? text.slice(0, 40) + '…' : text,
      percent: data.total ? Math.round((data.correct / data.total) * 100) : 0
    })).sort((a, b) => a.percent - b.percent); // מהקשה לקלה

    const hardest = questionChart[0] || null;
    const easiest = questionChart[questionChart.length - 1] || null;

    res.json({
      totalSessions: sessions.length,
      avgScore,
      totalPlayers: sessions.reduce((sum, s) => sum + s.totalPlayers, 0),
      questionChart,
      hardest,
      easiest,
      recentSessions: sessions.slice(0, 5).map(s => ({
        id: s._id,
        totalPlayers: s.totalPlayers,
        playedAt: s.playedAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =====================================================
   GET /stats/session/:id  — Per Game Session
===================================================== */
router.get('/session/:id', async (req, res) => {
  try {
    const session = await Gamesession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const sorted = [...session.players].sort((a, b) => b.score - a.score);

    res.json({
      ...session,
      players: sorted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =====================================================
   GET /stats/global  — Global Stats (מחוברים בלבד)
===================================================== */
router.get('/global', async (req, res) => {
  try {
    const [totalUsers, totalQuizzes, totalSessions] = await Promise.all([
      User.countDocuments(),
      Quiz.countDocuments(),
      Gamesession.countDocuments()
    ]);

    const totalPlayersEver = await Gamesession.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPlayers' } } }
    ]);

    // 5 חידונים הכי פופולריים
    const popular = await Gamesession.aggregate([
      { $group: { _id: '$quizId', count: { $sum: 1 }, title: { $first: '$quizTitle' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // פעילות 12 חודשים אחרונים
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    const monthlyActivity = await Gamesession.aggregate([
      { $match: { playedAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$playedAt' }, month: { $month: '$playedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
    const activityChart = monthlyActivity.map(m => ({
      label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      count: m.count
    }));

    res.json({
      totalUsers,
      totalQuizzes,
      totalSessions,
      totalPlayersEver: totalPlayersEver[0]?.total || 0,
      popularQuizzes: popular,
      activityChart
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Helper ──────────────────────────────────────────
function weekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // ראשית שבוע
  return d.toISOString().slice(0, 10);
}

export default router;