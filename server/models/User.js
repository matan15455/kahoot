import mongoose from 'mongoose'; 

// סכמת משתמש
const UserSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    unique: true
  },

  password: {             // סיסמה
    type: String,         // מחרוזת
    required: true        // חובה למלא
  }

}, { timestamps: true });  // מוסיף תאריכים של יצירה ועדכון

export default mongoose.model('User', UserSchema); // יוצרים את המודל ושולחים אותו החוצה