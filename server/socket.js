import { Server } from "socket.io";
import Quiz from "./models/Quiz.js"; // המודל של החידון
import { RoomManager } from "./realtime/RoomManager.js";

const rooms = new RoomManager();

function hostRoom(roomId) {
  return `${roomId}:host`;
}

function playersRoom(roomId) {
  return `${roomId}:players`;
}

export default function initSocket(server) {
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // =======================
    // יצירת חדר
    // =======================
    socket.on("createRoom", ({ hostId, quizId }) => {
      if (!hostId || !quizId) {
        io.to(socket.id).emit("error", "Invalid payload");
        return;
      }

      const { roomId } = rooms.createRoom(String(hostId), socket.id, String(quizId));

      // Everyone (host + players) stay in the base room for shared events
      socket.join(roomId);
      // Host-only sub-room for host events
      socket.join(hostRoom(roomId));

      socket.data.roomId = roomId;
      socket.data.userId = String(hostId);
      socket.data.role = "host";

      io.to(socket.id).emit("roomCreated", { roomId });
      console.log(`🏠 Room ${roomId} created by ${hostId} quiz ${quizId}`);
    });

    function initAnswersCount(roomId) {
      const room = rooms.getRoom(roomId);
      const currentQ = room.questions[room.currentQuestion];

      room.answersCount = {};
      currentQ.answers.forEach(ans => {
        room.answersCount[ans.text] = 0;
      });

      room.totalAnswers = 0;
    }

    function finishQuestion(roomId) {
      const room = rooms.getRoom(roomId);
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
      const room = rooms.getRoom(roomId);
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
      const userId = user?.id;
      const username = user?.username;
      if (!roomId || !userId || !username) {
        io.to(socket.id).emit("error", "Invalid payload");
        return;
      }

      const result = rooms.joinRoom(String(roomId), {
        userId: String(userId),
        socketId: socket.id,
        username: String(username),
      });

      if (!result.ok) {
        io.to(socket.id).emit("error", result.error);
        return;
      }

      socket.join(String(roomId));
      socket.join(playersRoom(String(roomId)));

      socket.data.roomId = String(roomId);
      socket.data.userId = String(userId);
      socket.data.role = "player";

      // שולח עדכון לכל מי שבחדר
      const snapshot = rooms.snapshot(String(roomId));
      io.to(String(roomId)).emit("playersUpdated", snapshot.players);

      console.log(`👥 ${username} joined room ${roomId}`);
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
      const room = rooms.getRoom(roomId);
      if (!room) {
        io.to(socket.id).emit("error", "Room not found");
        return;
      }

      // Only host can start
      if (!socket.data?.userId || room.hostUserId !== String(socket.data.userId)) {
        io.to(socket.id).emit("error", "Only host can start");
        return;
      }

      try {
        const quiz = await Quiz.findById(room.quizId).populate("questions");
        if (!quiz)
           return io.to(socket.id).emit("error", "Quiz not found");

        room.questions = quiz.questions;
        room.currentQuestion = 0;
        room.phase = "question";

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
      const room = rooms.getRoom(roomId);
      if (!room) return;
      if (room.phase !== "question") return;

      const currentQ = room.questions[room.currentQuestion];
      const chosenAnswer = currentQ.answers.find(a => a.text === answerText);
      if (!chosenAnswer) 
        return;

      // Authoritative identity from socket, not payload (payload kept for backward compatibility)
      const actorUserId = String(socket.data?.userId ?? userId ?? "");
      if (!actorUserId) return;

      const player = room.players.get(actorUserId);
      if (!player) return;

      // סופרים תשובה
      room.answersCount[answerText]++;
      room.totalAnswers++;

      // ניקוד
      if (chosenAnswer.isCorrect) {
        player.score += currentQ.points;
      }

      // האם כל השחקנים ענו?
      if (room.totalAnswers === room.players.size) {
        finishQuestion(roomId);
      }
    });

    socket.on("getCurrentQuestion", ({ roomId }) => {
      const room = rooms.getRoom(roomId);
      if (!room || !room.questions) return;

      const q = room.questions[room.currentQuestion];

      // Send only to the requester role (prevents host/player leakage)
      if (socket.data?.role === "host") {
        sendQuestionToHost(roomId, room.currentQuestion, q);
      } else {
        sendQuestionToPlayers(roomId, room.currentQuestion, q, socket.id);
      }

      socket.emit("questionTimerStarted", {
        endsAt: room.endsAt
      });
      
    });


    // =======================
    // מעבר לשאלה הבאה (מארח)
    // =======================
    socket.on("nextQuestion", ({ roomId }) => {
      const room = rooms.getRoom(roomId);
      if (!room) return;
      if (!socket.data?.userId || room.hostUserId !== String(socket.data.userId)) return;

      // אם אין עוד שאלות --> סוף משחק 
      if (room.currentQuestion >= room.questions.length - 1) {
        room.phase = "ended";
        io.to(roomId).emit("quizEnded", { players: [...room.players.values()].map(p => ({ id: p.userId, username: p.username, score: p.score })) });

        clearTimeout(room.questionTimer);

        rooms.deleteRoom(roomId);
        console.log(`🗑 Room ${roomId} deleted after quiz end`);

        return;
      }

      room.currentQuestion++;
      room.phase = "question";

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
      const result = rooms.disconnect(socket.id);
      if (!result) return;

      const snapshot = rooms.snapshot(result.roomId);
      if (snapshot) {
        io.to(result.roomId).emit("playersUpdated", snapshot.players);
      }
    });

    function sendQuestionToHost(roomId, questionIndex, question) {
      const room = rooms.getRoom(roomId);
      if (!room) return;

      io.to(hostRoom(roomId)).emit("GetQuestionForHost", {
        questionIndex,
        question
      });
    }

   function sendQuestionToPlayers(roomId, questionIndex, question, onlySocketId = null) {
      const target = onlySocketId ? onlySocketId : playersRoom(roomId);
      io.to(target).emit("GetQuestionForPlayer", {
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
