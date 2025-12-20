import mongoose from 'mongoose'; // מייבאים mongoose

// סכמת תשובה
const AnswerSchema = new mongoose.Schema({
  text: {          // טקסט של התשובה
    type: String,
    required: true
  },
  isCorrect: {     // האם זו התשובה הנכונה
    type: Boolean,
    required: true
  }
});

// סכמת שאלה
const QuestionSchema = new mongoose.Schema({
  text: {             // טקסט השאלה
    type: String,
    required: true
  },
  type: {             // סוג השאלה: אמריקאית או אמת/שקר
    type: String,
    enum: ['multiple-choice', 'true-false'], // רק שתי אפשרויות אפשריות
    required: true
  },
  time: {             // זמן לשאלה בשניות
    type: Number,
    required: true
  },
  points: {           // מספר הנקודות שהשאלה שווה
    type: Number,
    required: true
  },
  answers: [AnswerSchema]  // מערך של תשובות (תואם ל-AnswerSchema)
}, { timestamps: true });  // מוסיף תאריכי יצירה ועדכון

export default mongoose.model('Question', QuestionSchema); // יוצרים את המודל ושולחים החוצה
