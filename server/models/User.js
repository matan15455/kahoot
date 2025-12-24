import mongoose from 'mongoose'; 

// סכמת משתמש
const UserSchema = new mongoose.Schema({
  username: {             // שם משתמש
    type: String,         // סוג הנתון הוא מחרוזת
    required: true,       // חובה למלא
    unique: true          // חייב להיות ייחודי במסד הנתונים
  },
  
  password: {             // סיסמה
    type: String,         // סוג הנתון מחרוזת
    required: true        // חובה למלא
  },

  firstName: {             // שם פרטי
    type: String
  },

  lastName: {              // שם משפחה
    type: String
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
