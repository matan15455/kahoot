import { Server } from "socket.io";
import Quiz from "./models/Quiz.js";
import jwt from "jsonwebtoken";


const rooms = {};

/* ===========================
   PHASES 
=========================== */
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
      socket.mongoId = decoded.mongoId; // ObjectId של Mongo
      socket.idUser = decoded.id;       // המזהה שהמשתמש הזין
      next();
    } 
    catch (e) {
      return next(new Error("Invalid token"));
    }

  });

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.mongoId,socket.idUser);    

    /* =====================================================
        Helpers
    ===================================================== */

    function emitRoom(roomId) {
      const room = rooms[roomId];
      if (!room) 
        return;

      const payload = {
        roomId: room.id,
        phase: room.phase,
        players: room.players,
        questionIndex: room.currentQuestionIndex,
        endsAt: room.timer.endsAt
      };

      // שאלה נשלחת רק בפאזה QUESTION
      if (room.phase === PHASES.QUESTION) {
        payload.question = sanitizeQuestion(
          room.questions[room.currentQuestionIndex]
        );
      }

      // סיכום נשלח רק בפאזה SUMMARY
      if (room.phase === PHASES.SUMMARY) {
        payload.summary = {
          answersCount: room.answersCount,
          correctAnswer: getCorrectAnswer(room)
        };
      }

      io.to(roomId).emit("roomUpdated", payload);
    }

    /**
     * מסיר מידע רגיש (isCorrect) לפני שליחה ללקוח
     */
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
      if (!room) 
        return;

      clearTimeout(room.timer.timeoutId);
      room.phase = PHASES.SUMMARY;
      emitRoom(roomId);
    }

    /* =====================================================
        Create Room (Host)
    ===================================================== */

    socket.on("createRoom", ({ quizId }) => {

      if (!socket.mongoId) 
        return;
      
      const userId = socket.mongoId;

      // מוחק חדר קודם של אותו משתמש (Host)
      for (const id in rooms) {
        if (rooms[id].hostId === userId) {
          clearTimeout(rooms[id].timer.timeoutId);
          delete rooms[id];
        }
      }

      const roomId = Math.random().toString(36).substring(2, 8);

      rooms[roomId] = {
        id: roomId,                 // מזהה החדר (קוד הצטרפות)
        hostId: userId,             // מזהה המשתמש שהוא המארח
        quizId,                     // מזהה החידון במסד הנתונים
        phase: PHASES.LOBBY,        // מצב המשחק הנוכחי (LOBBY / QUESTION / SUMMARY / END)
        currentQuestionIndex: 0,    // אינדקס השאלה הפעילה
        questions: [],              // כל שאלות החידון (נטען מהשרת)
        players: [],                // רשימת שחקנים וניקוד
        answersCount: {},           // ספירת תשובות לשאלה הנוכחית
        totalAnswers: 0,            // מספר השחקנים שענו
        timer: {
          endsAt: null,             // זמן סיום מוחלט של השאלה
          timeoutId: null           // מזהה הטיימר של השאלה
        }
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

      if (!room) {
        return callback({ ok: false, message: "קוד חדר לא תקין" });
      }

      if (room.phase !== PHASES.LOBBY) {
        return callback({ ok: false, message: "המשחק כבר התחיל" });
      }

      if (room.players.some(p => p.nickname === nickname)) {
        return callback({ ok: false, message: "השם כבר תפוס" });
      }

      room.players.push({
        socketId: socket.id,
        userId: socket.mongoId || socket.id,
        nickname,
        score: 0
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
      if (!room) 
        return;

      if (room.hostId !== socket.mongoId) 
        return;

      const quiz = await Quiz.findById(room.quizId).populate("questions");
      if (!quiz) 
        return;

      room.questions = quiz.questions;
      room.currentQuestionIndex = 0;
      room.phase = PHASES.QUESTION;

      initAnswers(room);
      startTimer(roomId);
      emitRoom(roomId);
    });

    /* =====================================================
        Answer Question (Player)
    ===================================================== */

    socket.on("answerQuestion", ({ roomId, answerText }) => {
      const room = rooms[roomId];
      if (!room || room.phase !== PHASES.QUESTION) 
        return;

      const player = room.players.find(p => p.userId === (socket.mongoId || socket.id));
      if (!player) 
        return;

      const q = room.questions[room.currentQuestionIndex];

      room.answersCount[answerText]++;
      room.totalAnswers++;

      const correct = getCorrectAnswer(room);
      if (answerText === correct) {
        player.score += q.points;
      }

      // כולם ענו → סיום שאלה
      if (room.totalAnswers === room.players.length) {
        finishQuestion(roomId);
      }
    });

    /* =====================================================
        Next Question (Host)
    ===================================================== */

    socket.on("nextQuestion", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) 
        return;

      if (room.hostId !== socket.mongoId) 
        return;

      //  אם אנחנו באמצע שאלה → קודם סיכום
      if (room.phase === PHASES.QUESTION) {
        finishQuestion(roomId);
        return;
      }

      if (room.phase === PHASES.SUMMARY) {
        room.phase = PHASES.SCORES;
        emitRoom(roomId);
        return;
      }

      // SCORES → QUESTION / END
      if (room.phase === PHASES.SCORES) {
        // סוף חידון
        if (room.currentQuestionIndex >= room.questions.length - 1) {
          room.phase = PHASES.END;
          emitRoom(roomId);
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
        room.players = room.players.filter(
          p => p.socketId !== socket.id
        );
        emitRoom(roomId);
      }
    });
  });
}
