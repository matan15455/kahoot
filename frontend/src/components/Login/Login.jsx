import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { Bolt, Trophy, Flame, Gift, User } from "lucide-react";
import "./Login.css";

export default function Login() {
  const [idUser, setIdUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.get("http://localhost:5000/auth/login", {
        params: { id: idUser, password },
      });
      login({ token: res.data.token });
      navigate("/my-quizzes");
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ep-login-page">
      {/* Blobs */}
      <div className="ep-blob ep-blob--a" />
      <div className="ep-blob ep-blob--b" />
      <div className="ep-blob ep-blob--c" />

      {/* Header */}
      <header className="ep-header">
        <div className="ep-logo">EDUPLAY</div>
        <div className="ep-avatar-btn">
          <User size={20} />
        </div>
      </header>

      <main className="ep-main">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="ep-hero"
        >
          <h1 className="ep-hero-title">
            Level <span className="ep-accent">Up</span> Your Brain.
          </h1>
          <p className="ep-hero-sub">התחבר לזירה והתחל את רצף הניצחונות שלך.</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="ep-card"
        >
          <div className="ep-card-glow" />

          <form className="ep-form" onSubmit={handleSubmit}>
            <div className="ep-field">
              <label className="ep-label">תעודת זהות</label>
              <input
                type="text"
                className="ep-input"
                placeholder="123456789"
                value={idUser}
                onChange={(e) => setIdUser(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="ep-field">
              <div className="ep-label-row">
                <label className="ep-label">סיסמה</label>
                <button
                  type="button"
                  className="ep-forgot"
                  onClick={() => navigate("/register")}
                >
                  הרשמה
                </button>
              </div>
              <input
                type="password"
                className="ep-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="ep-error" role="alert">
                <span className="ep-error-icon">!</span>
                <span>{error}</span>
              </div>
            )}

            <button className="ep-submit-btn" type="submit" disabled={loading}>
              <span className="ep-btn-shine" />
              <span className="ep-btn-text">
                {loading ? "מתחבר..." : "כנס לזירה"}
              </span>
              {!loading && (
                <Bolt size={20} className="ep-bolt" />
              )}
            </button>
          </form>

          <div className="ep-divider">
            <span />
            <p>או המשך עם</p>
            <span />
          </div>
        </motion.div>

        {/* Register link */}
        <div className="ep-register-link">
          <p>
            מתמודד חדש?{" "}
            <button
              type="button"
              className="ep-register-btn"
              onClick={() => navigate("/register")}
            >
              צור חשבון
            </button>
          </p>
        </div>
      </main>

      {/* Stats footer */}
      <footer className="ep-stats">
        <div className="ep-stat-card">
          <Trophy size={24} className="ep-stat-icon" />
          <span className="ep-stat-label">דירוג גלובלי</span>
        </div>
        <div className="ep-stat-card ep-stat-card--fire">
          <Flame size={24} className="ep-stat-icon ep-stat-icon--fire" />
          <span className="ep-stat-label ep-stat-label--fire">10K+ רצפים</span>
        </div>
        <div className="ep-stat-card">
          <Gift size={24} className="ep-stat-icon ep-stat-icon--gift" />
          <span className="ep-stat-label">פרסים יומיים</span>
        </div>
      </footer>
    </div>
  );
}