import mongoose from "mongoose";

// מייצג תשובה בודדת של שחקן לשאלה אחת  
const AnswerSchema = new mongoose.Schema({
  questionIndex: Number,  // האינדקס של השאלה
  answered:      String,   // הטקסט של התשובה שהשחקן בחר
  isCorrect:     Boolean, // האם התשובה נכונה
  timeToAnswer:  Number,   // כמה זמן לקח לו לענות בשניות
  pointsEarned:  Number // כמה נקודות קיבל על התשובה
}, { _id: false });

// מייצג את הביצועים של שחקן אחד לאורך כל המשחק
const PlayerResultSchema = new mongoose.Schema({
  nickname:    String, // שם השחקן
  score:       Number, // ניקוד סופי מצטבר
  answers:     [AnswerSchema] // כל התשובות שהשחקן נתן
}, { _id: false });

// סטטיסטיקה מצטברת על שאלה בודדת עבור כל השחקנים במשחק
const QuestionStatSchema = new mongoose.Schema({
  text:          String, // שם השאלה
  correctAnswers: [String], // תשובה נכונה
  totalAnswered: Number, // כמה שחקנים ענו על השאלה הזאת
  totalCorrect:  Number // כמה ענו נכון כדי לחשב אחוזי הצלחה
}, { _id: false });

// מייצג מופע של משחק שלם
const GameSessionSchema = new mongoose.Schema({
  quizId:       { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }, // החידון עצמו
  quizTitle:    String, // כותרת החידון כדי להציג אותו גם כשהחידון נמחק
  hostId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  players:      [PlayerResultSchema], //ביצועי כל השחקנים שהשתתפו 
  questions:    [QuestionStatSchema] // סטטיסטיקה לכל שאלות המשחק
}, { timestamps: true });

export default mongoose.model("GameSession", GameSessionSchema);