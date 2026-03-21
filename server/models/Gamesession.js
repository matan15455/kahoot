import mongoose from 'mongoose';

const PlayerResultSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  userId: { type: String },
  score: { type: Number, default: 0 },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      questionText: { type: String },
      answerText: { type: String },
      isCorrect: { type: Boolean },
      timeToAnswer: { type: Number } // ms מרגע פתיחת השאלה
    }
  ]
});

const GameSessionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  quizTitle: { type: String },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [PlayerResultSchema],
  totalPlayers: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },

  // אחוז נכון לכל שאלה
  questionStats: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId },
      questionText: { type: String },
      correctCount: { type: Number, default: 0 },
      totalAnswers: { type: Number, default: 0 },
      correctPercent: { type: Number, default: 0 }
    }
  ],

  playedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('GameSession', GameSessionSchema);