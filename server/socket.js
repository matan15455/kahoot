import { Server } from "socket.io";
import Quiz from "./models/Quiz.js";
import GameSession from "./models/GameSession.js";
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

    const token = socket.handshake.auth?.token; // מחפש טוקן

    // אם אין אז אורח
    if (!token) {
      socket.mongoId = null;
      socket.username = "Guest";
      return next();
    }

    // אם יש אז מנסה לאמת
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.mongoId = decoded.mongoId; // ObjectId של Mongo
      socket.username = decoded.id;       // המזהה שהמשתמש הזין
      next();
    } 
    catch (e) {
      return next(new Error("Invalid token"));
    }

  });

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.mongoId,socket.username);    

    /* =====================================================
        Helpers
    ===================================================== */

    // שולח חדר
    function emitRoom(roomId) {
      const room = rooms[roomId];
      if (!room) 
        return;

      const payload = {
        roomId: room.id,
        phase: room.phase,
        players: room.players,
        questionIndex: room.currentQuestionIndex,
        endsAt: room.timer.endsAt,
        serverTime: Date.now()
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
          correctAnswer: getCorrectAnswer(room),
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

    // מחזיר תשובה נכונה של השאלה הנוכחית
    function getCorrectAnswer(room) {
      const q = room.questions[room.currentQuestionIndex];
      return q.answers.find(a => a.isCorrect).text;
    }

    // 
    function initAnswers(room) {
      room.answersCount = {}; // מאפס כמה שחקנים בחרו כל תשובה
      room.totalAnswers = 0; // כמה שחקנים כבר ענו על השאלה הנוכחית

      const q = room.questions[room.currentQuestionIndex];
      q.answers.forEach(a => { // מאפס את כמות השחקנים שענו לשאלה הנוכחית
        room.answersCount[a.text] = 0;
      });
    }

    // מתחיל טיימר
    function startTimer(roomId) {
      const room = rooms[roomId];
      const q = room.questions[room.currentQuestionIndex];

      clearTimeout(room.timer.timeoutId); // מנקה 

      // שעה לסיום
      room.timer.endsAt = Date.now() + q.time * 1000;

      // אם נגמר הזמן - מסיים שאלה
      room.timer.timeoutId = setTimeout(() => {
        finishQuestion(roomId);
      }, q.time * 1000);
    }

    // מסיים שאלה
    function finishQuestion(roomId) {
      const room = rooms[roomId];
      if (!room) 
        return;

      //מנקה טיימר 
      clearTimeout(room.timer.timeoutId);
      room.phase = PHASES.SUMMARY;
      emitRoom(roomId);
    }

    async function saveSession(room) {
      try {
        const questionStats = room.questions.map((q, idx) => {
          const correctText  = q.answers.find(a => a.isCorrect).text;

          // ספור כמה ענו נכון לשאלה הזו מתוך כל התשובות של השחקנים
          const totalCorrect = room.players.reduce((sum, p) => {
            const ans = p.answers.find(a => a.questionIndex === idx);
            return sum + (ans?.isCorrect ? 1 : 0);
          }, 0);

          return {
            index:         idx,
            text:          q.text,
            correctAnswer: correctText,
            totalAnswered: room.players.filter(p =>
              p.answers.some(a => a.questionIndex === idx)
            ).length,
            totalCorrect
          };
        });

        const quiz = await Quiz.findById(room.quizId).select("title");

        await GameSession.create({
          quizId:    room.quizId,
          quizTitle: quiz?.title || "חידון",
          hostId:    room.hostId,
          players:   room.players.map(p => ({
            nickname: p.nickname,
            score:    p.score,
            answers:  p.answers
          })),
          questions: questionStats
        });

        console.log("✅ GameSession saved");
      } catch (err) {
        console.error("❌ Failed to save GameSession:", err);
      }
    }

    /* =====================================================
        Create Room (Host)
    ===================================================== */

    // מקבל קוד חידון ויוצר חדר
    socket.on("createRoom", ({ quizId }) => {

      console.log("createRoom - socket.mongoId:", socket.mongoId);

      // בודק שהמשתמש שיוצר לא אורח
      if (!socket.mongoId) 
        return;
      
      // מזהה משתמש
      const userId = socket.mongoId;

      // מוחק חדר קודם של אותו משתמש (Host)
      for (const id in rooms) {
        if (rooms[id].hostId === userId) {
          clearTimeout(rooms[id].timer.timeoutId);
          delete rooms[id];
        }
      }

      // יוצר מזהה ייחודי לחדר
      let roomId;
      do {
        roomId = Math.random().toString(36).substring(2, 8);
      } while (rooms[roomId]);

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
          endsAt: null,            // מתי השאלה מסתיימת 
          timeoutId: null           // מזהה הטיימר של setTimeout
        }
      };

      // מכניס את המשתמש לחדר בסוקט
      socket.join(roomId);

      // שולח מצב חדר
      emitRoom(roomId);

      console.log(`🏠 Room ${roomId} created by ${userId}`);
    });

    /* =====================================================
        Join Room (Player)
    ===================================================== */


    // התחברות לחדר
    socket.on("joinRoom", ({ roomId, nickname }, callback) => {
      const room = rooms[roomId];

      // בודק שיש קוד בכלל
      if (!room) {
        return callback({ ok: false, message: "קוד חדר לא תקין" });
      }

      // בודק שהמשחק כבר לא התחיל
      if (room.phase !== PHASES.LOBBY) {
        return callback({ ok: false, message: "המשחק כבר התחיל" });
      }
      
      // בודק שאין שם כזה
      if (room.players.some(p => p.nickname === nickname)) {
        return callback({ ok: false, message: "השם כבר תפוס" });
      }

      // מכניס את המשתמש
      room.players.push({
        socketId:    socket.id,
        userId:      socket.mongoId || socket.id,
        nickname,
        score:       0,
        answers:     []          // ← חדש
      });

      // מכניס את המשתמש לחדר
      socket.join(roomId);

      //שולח מצב חדר 
      emitRoom(roomId);

      callback({ ok: true });
    });


    /* =====================================================
        Start Quiz (Host)
    ===================================================== */

    // מתחיל חידון
    socket.on("startQuiz", async ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) 
        return;

      // בודק שזה באמת מי שיצר את החידון
      if (String(room.hostId) !== String(socket.mongoId)) 
        return;

      // מחלץ את החידון
      const quiz = await Quiz.findById(room.quizId).populate("questions");
      if (!quiz) 
        return;

      // מעדכן את החדר
      room.questions = quiz.questions;
      room.currentQuestionIndex = 0;
      room.phase = PHASES.QUESTION;

      // מאתחל מספור תשובות
      initAnswers(room);

      // מתחיל טיימר
      startTimer(roomId);

      // שולח מצב חדר
      emitRoom(roomId);
    });

    /* =====================================================
        Answer Question (Player)
    ===================================================== */

    //מתבצע כששחקן עונה על שאלה
    socket.on("answerQuestion", ({ roomId, answerText }) => {
      const room  = rooms[roomId];
      if (!room || room.phase !== PHASES.QUESTION) return;

      const player = room.players.find(p => p.userId === (socket.mongoId || socket.id));
      if (!player) return;

      const q       = room.questions[room.currentQuestionIndex];
      const correct = getCorrectAnswer(room);
      const isCorrect = answerText === correct;

      let pointsEarned = 0;
      if (isCorrect) {
        const timeLeft = Math.max(0, room.timer.endsAt - Date.now()) / 1000;
        const ratio    = timeLeft / q.time;
        pointsEarned   = Math.round(q.points * (0.5 + 0.5 * ratio));
        player.score  += pointsEarned;
        socket.emit("scoreEarned", { earned: pointsEarned });
      }

      // ← חדש: שמור את התשובה
      const timeToAnswer = q.time - Math.max(0, (room.timer.endsAt - Date.now()) / 1000);
      player.answers.push({
        questionIndex: room.currentQuestionIndex,
        questionText:  q.text,
        answered:      answerText,
        isCorrect,
        timeToAnswer:  Math.round(timeToAnswer * 10) / 10,
        pointsEarned
      });

      room.answersCount[answerText]++;
      room.totalAnswers++;

      if (room.totalAnswers === room.players.length) {
        finishQuestion(roomId);
      }
    });

    /* =====================================================
        Next Question (Host)
    ===================================================== */
    // ממאזין לסיום שאלה מהמארח
    socket.on("nextQuestion",async  ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) 
        return;

      // בודק שבאמת המארח שלח את הEMIT
      if (String(room.hostId) !== String(socket.mongoId)) 
        return;

      //  אם אנחנו באמצע שאלה → קודם סיכום
      if (room.phase === PHASES.QUESTION) {
        finishQuestion(roomId);
        return;
      }

      // אם באמצע סיכום אז תציג ניקוד
      if (room.phase === PHASES.SUMMARY) {
        room.phase = PHASES.SCORES;
        emitRoom(roomId);
        return;
      }

      // SCORES → QUESTION / END
      if (room.phase === PHASES.SCORES) {
        // אם זה סוף חידון
        if (room.currentQuestionIndex >= room.questions.length - 1) {
          room.phase = PHASES.END;

          await saveSession(room);

          emitRoom(roomId);
          delete rooms[roomId];
          return;
        }

        // אם זה לא סוף חיידון
        // מקדם את השאלה הנוכחית
        room.currentQuestionIndex++;

        // משנה למצב שאלה
        room.phase = PHASES.QUESTION;

        initAnswers(room);
        startTimer(roomId);
        emitRoom(roomId);
      }
    });

    // כשנכנסים למסך המשחק, יש חלון זמן קצר בין רישום ה-listener לבין הרגע שה-socket מוכן — אם roomUpdated נשלח מהשרת בדיוק בחלון הזה, הלקוח לא יקבל אותו.
    socket.on("requestRoomState", ({ roomId }) => {
      emitRoom(roomId);
    });

    socket.on("kickPlayer", ({ roomId, nickname }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (String(room.hostId) !== String(socket.mongoId)) return;
      if (room.phase !== PHASES.LOBBY) return;

      const player = room.players.find(p => p.nickname === nickname);
      if (!player) return;

      io.to(player.socketId).emit("kicked");
      room.players = room.players.filter(p => p.nickname !== nickname);
      emitRoom(roomId);
    });


    /* =====================================================
       Disconnect
    ===================================================== */

    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        const room = rooms[roomId];

        // אם המארח התנתק - סגור את החדר
        if (String(room.hostId) === String(socket.mongoId)) {
          clearTimeout(room.timer.timeoutId);
          io.to(roomId).emit("roomUpdated", { ...room, phase: "END" });
          delete rooms[roomId];
          continue;
        }

        // אחרת - הסר את השחקן
        room.players = room.players.filter(p => p.socketId !== socket.id);
        emitRoom(roomId);
      }
    });
  });
}
