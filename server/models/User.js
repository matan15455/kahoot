import mongoose from 'mongoose'; 
import bcrypt from 'bcryptjs';

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

// הצפנת סיסמה לפני שמירה
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) 
    return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// פונקציה להשוואת סיסמאות
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema); // יוצרים את המודל ושולחים אותו החוצה
