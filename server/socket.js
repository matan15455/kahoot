import { Server } from "socket.io";
import Quiz from "./models/Quiz.js"; // המודל של החידון

const rooms = {}; // החדרים בזיכרון

export default function initSocket(server) {
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // =======================
    // יצירת חדר
    // =======================
    socket.on("createRoom", ({ hostId, quizId }) => {

      //מחית החדר הקודם של אותו מארח
       for (const roomId in rooms) {
        const room = rooms[roomId];

        if (room.hostId === hostId) {
          clearTimeout(room.questionTimer);
          delete rooms[roomId];
          console.log(`🧹 Old room ${roomId} removed before creating new one`);
        }
      }

      //יצירת קוד לחדר
      const roomId = Math.random().toString(36).substring(2, 8);

      rooms[roomId] = {
        hostId:hostId,
        quizId:quizId,
        players: [],
        currentQuestion: 0,
        questionTimer: null,
        answersCount: {}
      };

      socket.join(roomId);
      io.to(socket.id).emit("roomCreated", { roomId });
      console.log(`🏠 Room ${roomId} created by ${hostId} quiz ${quizId}`);
    });

    function initAnswersCount(roomId) {
      const room = rooms[roomId];
      const currentQ = room.questions[room.currentQuestion];

      room.answersCount = {};
      currentQ.answers.forEach(ans => {
        room.answersCount[ans.text] = 0;
      });

      room.totalAnswers = 0;
    }

    function finishQuestion(roomId) {
      const room = rooms[roomId];
      if (!room) 
        return;

      clearTimeout(room.questionTimer);

      const currentQ = room.questions[room.currentQuestion];
      const correct = currentQ.answers.find(a => a.isCorrect).text

      io.to(roomId).emit("questionSummary", {
        questionIndex: room.currentQuestion,
        answersCount: room.answersCount,
        correctAnswer: correct
      });

      console.log("📊 Results for question:", room.answersCount);
    }


    function startQuestionTimer(roomId) {
      const room = rooms[roomId];
      if (!room) return;

      const q = room.questions[room.currentQuestion];
      const durationMs = q.time * 1000;

      clearTimeout(room.questionTimer);

      // ⏱ זמן סיום מוחלט
      room.endsAt = Date.now() + durationMs;

      // שולחים לכל החדר
      io.to(roomId).emit("questionTimerStarted", {
        endsAt: room.endsAt
      });

      room.questionTimer = setTimeout(() => {
        finishQuestion(roomId);
      }, durationMs);
    }



    // =======================
    // הצטרפות לחדר
    // =======================
    socket.on("joinRoom", ({ roomId, user }) => {
      const room = rooms[roomId];
      if (!room)
         return io.to(socket.id).emit("error", "Room not found");

      room.players.push({ id: user.id, username: user.username, score: 0 });
      socket.join(roomId);

      // שולח עדכון לכל מי שבחדר
      io.to(roomId).emit("playersUpdated", rooms[roomId].players);

      console.log(`👥 ${user.username} joined room ${roomId}`);
    });


    // socket.on("getSummary", ({ roomId }) => {
    //   const room = rooms[roomId];
    //   if (!room) return;

    //   const currentQ = room.questions[room.currentQuestion];

    //   const correct = currentQ.answers.find(a => a.isCorrect).text;

    //   io.to(socket.id).emit("questionSummary", {
    //     questionIndex: room.currentQuestion,
    //     answersCount: room.answersCount,
    //     correctAnswer: correct
    //   });

    //   console.log(`📨 Sent summary for room ${roomId}`);
    // });


    // =======================
    // התחלת חידון
    // =======================
    socket.on("startQuiz", async ({ roomId }) => {
      const room = rooms[roomId];
      if (!room)
         return io.to(socket.id).emit("error", "Room not found");

      try {
        const quiz = await Quiz.findById(room.quizId).populate("questions");
        if (!quiz)
           return io.to(socket.id).emit("error", "Quiz not found");

        room.questions = quiz.questions;
        room.currentQuestion = 0;

        initAnswersCount(roomId);
        startQuestionTimer(roomId);

        console.log(`▶️ Quiz started in room ${roomId}`);

        io.to(roomId).emit("quizStarted");


      } catch (err) {
        console.error(err);
        io.to(socket.id).emit("error", "Server error");
      }
    });

    // =======================
    // שליחת תשובה
    // =======================
    socket.on("answerQuestion", ({ roomId, userId, answerText }) => {
      const room = rooms[roomId];
      if (!room) return;

      const currentQ = room.questions[room.currentQuestion];
      const chosenAnswer = currentQ.answers.find(a => a.text === answerText);
      if (!chosenAnswer) 
        return;

      const player = room.players.find(p => p.id === userId);
      if (!player) 
        return;

      // סופרים תשובה
      room.answersCount[answerText]++;
      room.totalAnswers++;

      // ניקוד
      if (chosenAnswer.isCorrect) {
        player.score += currentQ.points;
      }

      // האם כל השחקנים ענו?
      if (room.totalAnswers === room.players.length) {
        finishQuestion(roomId);
      }
    });

    socket.on("getCurrentQuestion", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || !room.questions) return;

      const q = room.questions[room.currentQuestion];

      sendQuestionToHost(roomId, room.currentQuestion, q);
      sendQuestionToPlayers(roomId, room.currentQuestion, q);

      socket.emit("questionTimerStarted", {
        endsAt: room.endsAt
      });
      
    });


    // =======================
    // מעבר לשאלה הבאה (מארח)
    // =======================
    socket.on("nextQuestion", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;

      // אם אין עוד שאלות --> סוף משחק 
      if (room.currentQuestion >= room.questions.length - 1) {
        io.to(roomId).emit("quizEnded", { players: room.players });

        clearTimeout(room.questionTimer);

        delete rooms[roomId];
        console.log(`🗑 Room ${roomId} deleted after quiz end`);

        return;
      }

      room.currentQuestion++;

      initAnswersCount(roomId);
      startQuestionTimer(roomId);

      sendQuestionToHost(roomId, room.currentQuestion, room.questions[room.currentQuestion]);
      sendQuestionToPlayers(roomId, room.currentQuestion, room.questions[room.currentQuestion]);

      console.log(`▶️ Question changed to ${room.currentQuestion} in room ${roomId}`);
    });


    // =======================
    // התנתקות
    // =======================
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
      // אפשר למחוק את השחקן מרשימת השחקנים אם רוצים
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const index = room.players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          room.players.splice(index, 1);
          io.to(roomId).emit("playersUpdated", room.players);
        }
      }
    });

    function sendQuestionToHost(roomId, questionIndex, question) {
      const room = rooms[roomId];
      if (!room) return;

      io.to(roomId).emit("GetQuestionForHost", {
        questionIndex,
        question
      });
    }

   function sendQuestionToPlayers(roomId, questionIndex, question) {
      io.to(roomId).emit("GetQuestionForPlayer", {
        questionIndex:questionIndex,
        question: {
          text: question.text,
          time: question.time,
          answers: question.answers.map(a => ({
            text: a.text
          }))
        }
      });
    }

  });
}
