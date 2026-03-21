import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { isValidEmail, isValidPhone, isAdult21, isValidPassword } from "../../utils/validators";
import "./Profile.css";
import CircularProgress from '@mui/material/CircularProgress';
import Box from "@mui/material/Box";

export default function Profile() {
  const { token, userId, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: "",
    password: "",
    id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // חילוץ תאריך בפורמט YYYY-MM-DD אם יש צורך
        const formattedBirthday = res.data.birthday ? res.data.birthday.split('T')[0] : "";

        setUserData({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          birthday: formattedBirthday,
          password: "",
          id: res.data.id || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "שגיאה בטעינת נתוני משתמש");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, userId]);

  const handleUpdate = async () => {
    if (!userId) return;

    setError("");
    setSuccessMsg("");

    if (!isValidEmail(userData.email)) {
      setError("אימייל לא תקין");
      return;
    }

    if (!isValidPhone(userData.phone)) {
      setError("מספר טלפון לא תקין");
      return;
    }

    if (!isAdult21(userData.birthday)) {
      setError("המשתמש חייב להיות מעל גיל 21");
      return;
    }

    if (userData.password && !isValidPassword(userData.password)) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה, ספרה ותו מיוחד");
      return;
    }

    const updates = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      birthday: userData.birthday,
    };

    if (userData.password) {
      updates.password = userData.password;
    }

    try {
      setLoading(true);
      await axios.patch(
        `http://localhost:5000/user/${userId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg("הפרטים עודכנו בהצלחה! ✨");
      setUserData(prev => ({ ...prev, password: "" }));
      
      // העלמת הודעת ההצלחה אחרי כמה שניות
      setTimeout(() => setSuccessMsg(""), 4000);
      
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בעדכון המשתמש");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    if (!window.confirm("⚠️ האם אתה בטוח שאתה רוצה למחוק את המשתמש לצמיתות? פעולה זו בלתי הפיכה.")) 
      return;

    setLoading(true);
    setError("");
    try {
      await axios.delete(`http://localhost:5000/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("המשתמש נמחק בהצלחה");
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה במחיקת המשתמש");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="profile-wrapper">
      <div className="glass-panel profile-panel">
        <div className="profile-header">
          <div className="profile-avatar">
            {userData.name ? userData.name.charAt(0) : "👤"}
          </div>
          <h1 className="title-glow">הפרופיל שלי</h1>
        </div>

        {error && <div className="alert-box error-alert slide-in">{error}</div>}
        {successMsg && <div className="alert-box success-alert slide-in">{successMsg}</div>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress sx={{ color: '#00e5ff' }} size={60} thickness={4} />
          </Box>
        ) : (
          <div className="profile-form">
            <div className="id-badge">
              <span className="id-badge-label">תעודת זהות:</span>
              <span className="id-badge-value">{userData.id}</span>
            </div>

            <div className="form-grid">
              <div className="input-container">
                <input 
                  type="text" 
                  name="name" 
                  value={userData.name || ""} 
                  onChange={handleChange} 
                  required 
                  placeholder=" " 
                  className="modern-input"
                />
                <label className="modern-label">שם מלא</label>
              </div>

              <div className="input-container">
                <input 
                  type="email" 
                  name="email" 
                  value={userData.email || ""} 
                  onChange={handleChange} 
                  required 
                  placeholder=" " 
                  className="modern-input"
                />
                <label className="modern-label">אימייל</label>
              </div>

              <div className="input-container">
                <input 
                  type="tel" 
                  name="phone" 
                  value={userData.phone || ""} 
                  onChange={handleChange} 
                  placeholder=" " 
                  className="modern-input"
                  dir="ltr"
                />
                <label className="modern-label">טלפון</label>
              </div>

              <div className="input-container date-container">
                <input 
                  type="date" 
                  name="birthday" 
                  value={userData.birthday || ""} 
                  onChange={handleChange} 
                  className="modern-input date-input"
                />
                <label className="modern-label date-label">תאריך לידה</label>
              </div>

              <div className="input-container full-width">
                <input 
                  type="password" 
                  name="password" 
                  value={userData.password || ""} 
                  onChange={handleChange} 
                  placeholder=" " 
                  className="modern-input"
                  dir="ltr"
                />
                <label className="modern-label">סיסמה חדשה (השאר ריק כדי לא לשנות)</label>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                className="action-btn save-btn" 
                onClick={handleUpdate} 
                disabled={loading}
              >
                <span className="btn-icon">💾</span> שמור שינויים
              </button>

              <button 
                className="action-btn delete-btn" 
                onClick={handleDelete} 
                disabled={loading}
              >
                <span className="btn-icon">🗑</span> מחק משתמש
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}