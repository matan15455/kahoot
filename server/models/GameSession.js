import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  questionIndex: Number,
  answered:      String,   // מה השחקן בחר (null אם לא ענה)
  isCorrect:     Boolean,
  timeToAnswer:  Number,   // בשניות
  pointsEarned:  Number
}, { _id: false });

const PlayerResultSchema = new mongoose.Schema({
  nickname:    String,
  score:       Number,
  answers:     [AnswerSchema]
}, { _id: false });

const QuestionStatSchema = new mongoose.Schema({
  text:          String,
  correctAnswer: String,
  totalAnswered: Number,
  totalCorrect:  Number
}, { _id: false });

const GameSessionSchema = new mongoose.Schema({
  quizId:       { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  quizTitle:    String,
  hostId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  players:      [PlayerResultSchema],
  questions:    [QuestionStatSchema]
}, { timestamps: true });

export default mongoose.model("GameSession", GameSessionSchema);