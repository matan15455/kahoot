import mongoose from 'mongoose'; // מייבאים mongoose

// סכמת חידון
const QuizSchema = new mongoose.Schema({
  title: {           // שם החידון
    type: String,
    required: true
  },
  description: {     // תיאור החידון
    type: String
  },
  questions: [       // מערך מזהי שאלות
    {
      type: mongoose.Schema.Types.ObjectId, // מזהה של שאלה
      ref: 'Question'                       // מתייחס למודל Question
    }
  ],
  creatorId: {       // מזהה היוצר של החידון
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',     // מתייחס למודל User
    required: true
  }
}, { timestamps: true }); // מוסיף תאריכי יצירה ועדכון

export default mongoose.model('Quiz', QuizSchema); // יוצרים את המודל ושולחים החוצה
