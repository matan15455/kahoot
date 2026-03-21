import { Server } from "socket.io";
import Quiz from "./models/Quiz.js";
import Gamesession from "./models/Gamesession.js";
import jwt from "jsonwebtoken";

const rooms = {};

const PHASES = {
  LOBBY: "LOBBY",
  QUESTION: "QUESTION",
  SUMMARY: "SUMMARY",
  SCORES: "SCORES",
  END: "END"
};

export default function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.mongoId = null;
      socket.idUser = "Guest";
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.mongoId = decoded.mongoId;
      socket.idUser = decoded.id;
      next();
    } catch (e) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.mongoId, socket.idUser);

    /* =====================================================
        Helpers
    ===================================================== */
    function emitRoom(roomId) {
      const room = rooms[roomId];
      if (!room) return;

      const payload = {
        roomId: room.id,
        phase: room.phase,
        players: room.players,
        questionIndex: room.currentQuestionIndex,
        endsAt: room.timer.endsAt
      };

      if (room.phase === PHASES.QUESTION) {
        payload.question = sanitizeQuestion(room.questions[room.currentQuestionIndex]);
      }

      if (room.phase === PHASES.SUMMARY) {
        payload.summary = {
          answersCount: room.answersCount,
          correctAnswer: getCorrectAnswer(room)
        };
      }

      io.to(roomId).emit("roomUpdated", payload);
    }

    function sanitizeQuestion(q) {
      return {
        text: q.text,
        time: q.time,
        answers: q.answers.map(a => ({ text: a.text }))
      };
    }

    function getCorrectAnswer(room) {
      const q = room.questions[room.currentQuestionIndex];
      return q.answers.find(a => a.isCorrect).text;
    }

    function initAnswers(room) {
      room.answersCount = {};
      room.totalAnswers = 0;
      // עוקב אחרי זמן תחילת שאלה לחישוב timeToAnswer
      room.questionStartedAt = Date.now();

      const q = room.questions[room.currentQuestionIndex];
      q.answers.forEach(a => {
        room.answersCount[a.text] = 0;
      });
    }

    function startTimer(roomId) {
      const room = rooms[roomId];
      const q = room.questions[room.currentQuestionIndex];
      clearTimeout(room.timer.timeoutId);
      room.timer.endsAt = Date.now() + q.time * 1000;
      room.timer.timeoutId = setTimeout(() => {
        finishQuestion(roomId);
      }, q.time * 1000);
    }

    function finishQuestion(roomId) {
      const room = rooms[roomId];
      if (!room) return;

      // שמירת סטטיסטיקת שאלה
      const q = room.questions[room.currentQuestionIndex];
      const correctAnswer = q.answers.find(a => a.isCorrect)?.text;
      const correctCount = room.answersCount[correctAnswer] || 0;
      const totalAnswers = Object.values(room.answersCount).reduce((a, b) => a + b, 0);

      room.questionResults.push({
        questionId: q._id,
        questionText: q.text,
        correctCount,
        totalAnswers,
        correctPercent: totalAnswers ? Math.round((correctCount / totalAnswers) * 100) : 0
      });

      clearTimeout(room.timer.timeoutId);
      room.phase = PHASES.SUMMARY;
      emitRoom(roomId);
    }

    /* =====================================================
        שמירת GameSession למסד
    ===================================================== */
    async function saveGameSession(room) {
      try {
        const quiz = await Quiz.findById(room.quizId).lean();

        await Gamesession.create({
          quizId: room.quizId,
          quizTitle: quiz?.title || 'חידון',
          hostId: room.hostId,
          players: room.players.map(p => ({
            nickname: p.nickname,
            userId: p.userId,
            score: p.score,
            answers: p.answers || []
          })),
          totalPlayers: room.players.length,
          totalQuestions: room.questions.length,
          questionStats: room.questionResults
        });

        console.log(`💾 GameSession saved for room ${room.id}`);
      } catch (err) {
        console.error('❌ Failed to save GameSession:', err.message);
      }
    }

    /* =====================================================
        Create Room (Host)
    ===================================================== */
    socket.on("createRoom", ({ quizId }) => {
      if (!socket.mongoId) return;
      const userId = socket.mongoId;

      for (const id in rooms) {
        if (rooms[id].hostId === userId) {
          clearTimeout(rooms[id].timer.timeoutId);
          delete rooms[id];
        }
      }

      const roomId = Math.random().toString(36).substring(2, 8);

      rooms[roomId] = {
        id: roomId,
        hostId: userId,
        quizId,
        phase: PHASES.LOBBY,
        currentQuestionIndex: 0,
        questions: [],
        players: [],
        answersCount: {},
        totalAnswers: 0,
        questionResults: [], // ← חדש: לשמירת סטטיסטיקות
        questionStartedAt: null, // ← חדש: לחישוב זמן תשובה
        timer: { endsAt: null, timeoutId: null }
      };

      socket.join(roomId);
      emitRoom(roomId);
      console.log(`🏠 Room ${roomId} created by ${userId}`);
    });

    /* =====================================================
        Join Room (Player)
    ===================================================== */
    socket.on("joinRoom", ({ roomId, nickname }, callback) => {
      const room = rooms[roomId];
      if (!room) return callback({ ok: false, message: "קוד חדר לא תקין" });
      if (room.phase !== PHASES.LOBBY) return callback({ ok: false, message: "המשחק כבר התחיל" });
      if (room.players.some(p => p.nickname === nickname)) return callback({ ok: false, message: "השם כבר תפוס" });

      room.players.push({
        socketId: socket.id,
        userId: socket.mongoId || socket.id,
        nickname,
        score: 0,
        answers: [] // ← חדש: לשמירת תשובות
      });

      socket.join(roomId);
      emitRoom(roomId);
      callback({ ok: true });
    });

    /* =====================================================
        Start Quiz (Host)
    ===================================================== */
    socket.on("startQuiz", async ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (String(room.hostId) !== String(socket.mongoId)) return;

      const quiz = await Quiz.findById(room.quizId).populate("questions");
      if (!quiz) return;

      room.questions = quiz.questions;
      room.currentQuestionIndex = 0;
      room.phase = PHASES.QUESTION;
      room.questionResults = [];

      initAnswers(room);
      startTimer(roomId);
      emitRoom(roomId);
    });

    /* =====================================================
        Answer Question (Player)
    ===================================================== */
    socket.on("answerQuestion", ({ roomId, answerText }) => {
      const room = rooms[roomId];
      if (!room || room.phase !== PHASES.QUESTION) return;

      const player = room.players.find(p => p.userId === (socket.mongoId || socket.id));
      if (!player) return;

      // מונע תשובה כפולה
      const q = room.questions[room.currentQuestionIndex];
      const alreadyAnswered = player.answers.some(a => String(a.questionId) === String(q._id));
      if (alreadyAnswered) return;

      const timeToAnswer = Date.now() - (room.questionStartedAt || Date.now());
      const correct = getCorrectAnswer(room);
      const isCorrect = answerText === correct;

      room.answersCount[answerText] = (room.answersCount[answerText] || 0) + 1;
      room.totalAnswers++;

      if (isCorrect) {
        player.score += q.points;
      }

      // שמירת תשובה על השחקן
      player.answers.push({
        questionId: q._id,
        questionText: q.text,
        answerText,
        isCorrect,
        timeToAnswer
      });

      if (room.totalAnswers === room.players.length) {
        finishQuestion(roomId);
      }
    });

    /* =====================================================
        Next Question (Host)
    ===================================================== */
    socket.on("nextQuestion", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (String(room.hostId) !== String(socket.mongoId)) return;

      if (room.phase === PHASES.QUESTION) {
        finishQuestion(roomId);
        return;
      }

      if (room.phase === PHASES.SUMMARY) {
        room.phase = PHASES.SCORES;
        emitRoom(roomId);
        return;
      }

      if (room.phase === PHASES.SCORES) {
        if (room.currentQuestionIndex >= room.questions.length - 1) {
          room.phase = PHASES.END;
          emitRoom(roomId);

          // ← שמירה למסד לפני מחיקת החדר
          saveGameSession(room);
          delete rooms[roomId];
          return;
        }

        room.currentQuestionIndex++;
        room.phase = PHASES.QUESTION;
        initAnswers(room);
        startTimer(roomId);
        emitRoom(roomId);
      }
    });

    socket.on("requestRoomState", ({ roomId }) => {
      emitRoom(roomId);
    });

    /* =====================================================
       Disconnect
    ===================================================== */
    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        const room = rooms[roomId];

        if (String(room.hostId) === String(socket.mongoId)) {
          clearTimeout(room.timer.timeoutId);
          io.to(roomId).emit("roomUpdated", { ...room, phase: "END" });
          delete rooms[roomId];
          continue;
        }

        room.players = room.players.filter(p => p.socketId !== socket.id);
        emitRoom(roomId);
      }
    });
  });
}