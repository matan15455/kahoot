import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [idUser, setIdUser] = useState("");  // המזהה שהמשתמש הזין
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  //מטפל בהגשת טופס ההתחברות
  const handleSubmit = async (e) => {
    //מונע רענון של הדפדפן ומחיקת הSTATE
    e.preventDefault();
    
    //מוחק שגיאות קודמות
    setError("");

    try {
      const res = await axios.get("http://localhost:5000/auth/login", {
        params: {
          id: idUser,   // <-- השתנה
          password
        }
      });

      //שומר את הטוקן
      login({ token: res.data.token });


      //עובר לעמוד "החידונים שלי"
      navigate("/my-quizzes"); 
    } catch (err) {
      setError(
        err.response?.data?.message || "שגיאה בהתחברות"
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <span className="auth-orb auth-orb--a" />
        <span className="auth-orb auth-orb--b" />
        <span className="auth-orb auth-orb--c" />
        <span className="auth-grid" />
        <span className="auth-noise" />
      </div>

      <div className="auth-shell">

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card__top">
            <div className="auth-kicker">התחברות</div>
            <h1 className="auth-title">התחבר למשתמש שלך</h1>
            <div className="auth-subtitle">הכנס תעודת זהות וסיסמה</div>
          </div>

          <div className="auth-fields">
            <div className="input-group">
              <input
                className="auth-input"
                type="text"
                required
                value={idUser}
                onChange={(e) => setIdUser(e.target.value)}
                placeholder=" "
                autoComplete="id"
              />
              <label className="auth-label">תעודת זהות</label>
              <span className="input-ring" />
            </div>

            <div className="input-group">
              <input
                className="auth-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                autoComplete="current-password"
              />
              <label className="auth-label">סיסמה</label>
              <span className="input-ring" />
            </div>

            {error && (
              <div className="auth-error" role="alert" aria-live="polite">
                <span className="auth-error__icon">!</span>
                <span className="auth-error__text">{error}</span>
              </div>
            )}
          </div>

          <button className="auth-button" type="submit">
            <span className="auth-button__shine" />
            <span className="auth-button__text">התחבר</span>
            <span className="auth-button__arrow">→</span>
          </button>

          <div className="auth-divider">
            <span />
            <p>התחברות מוגנת</p>
            <span />
          </div>


        </form>


        <div className="auth-left">
          <div className="brand-chip">
            <span className="brand-dot" />
          </div>

          <h1 className="hero-title">
            ברוך השב
            <span className="hero-title__glow">.</span>
          </h1>
          <p className="hero-subtitle">
            התחבר כדי להמשיך - ליצור חידונים , לקבל סטטיסטיקות, ולנהל את המשתמש
          </p>

          

          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-num">⚡</div>
              <div className="stat-meta">
                <div className="stat-title">לייב</div>
                <div className="stat-desc">חדרים חיים</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-num">🛡️</div>
              <div className="stat-meta">
                <div className="stat-title">מוגן</div>
                <div className="stat-desc">התחברות מאובטחת</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-num">🎯</div>
              <div className="stat-meta">
                <div className="stat-title">AI</div>
                <div className="stat-desc"> יצירת חידונים באמצעות בינה מלאכותית</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
