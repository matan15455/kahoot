import mongoose from 'mongoose'; 

// סכמת משתמש
const UserSchema = new mongoose.Schema({
  
  id: {
    type: String,
    required: true,
    unique: true
  },
  
  password: {             // סיסמה
    type: String,         // מחרוזת
    required: true        // חובה למלא
  },

  name: {
    type: String,
    required: true
  },

  email: {                // אימייל
    type: String
  },

  phone: {                // טלפון
    type: String
  },

  birthday: {             // תאריך לידה
    type: String
  },
  
  quizzesCreated: [       // רשימת חידונים שהמשתמש יצר
    {
      type: mongoose.Schema.Types.ObjectId, // מזהה של חידון
      ref: 'Quiz'                           // מתייחס למודל Quiz
    }
  ],
  statistics: {           // סטטיסטיקות של המשתמש
    totalPoints: { type: Number, default: 0 },         // נקודות מצטברות
    quizzesCreatedCount: { type: Number, default: 0 }, // מספר חידונים שיצר
    quizzesPlayedCount: { type: Number, default: 0 }   // מספר חידונים ששיחק
  }
}, { timestamps: true });  // מוסיף תאריכים של יצירה ועדכון

export default mongoose.model('User', UserSchema); // יוצרים את המודל ושולחים אותו החוצה
