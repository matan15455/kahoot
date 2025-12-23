import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Register
      await axios.post("http://localhost:5000/auth/register", {
        username,
        password
      });

      // 2️⃣ Auto login after register
      const res = await axios.post("http://localhost:5000/auth/login", {
        username,
        password
      });

      // 3️⃣ Save to AuthContext
      login({
        token: res.data.token,
        user: res.data.user
      });

      navigate("/my-quizzes");
      
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <span className="auth-orb orb-a" />
        <span className="auth-orb orb-b" />
        <span className="auth-orb orb-c" />
        <span className="auth-grid" />
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <div className="auth-chip">הרשמה</div>
          <h1 className="auth-title">יצירת משתמש</h1>
          <p className="auth-subtitle">
            להצטרף ולהתחיל ליצור חידונים בעצמך
          </p>
        </div>

        <div className="auth-fields">
          <div className="input-group">
            <input
              className="auth-input"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
            />
            <label className="auth-label">שם משתמש</label>
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
            />
            <label className="auth-label">סיסמה</label>
            <span className="input-ring" />
          </div>

          {error && (
            <div className="auth-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}
        </div>

        <button
          className={`auth-button ${loading ? "loading" : ""}`}
          type="submit"
          disabled={loading}
        >
          {loading ? <span className="loader"></span> : "הירשם →"}
        </button>

        <div className="auth-footer">
          <p onClick={() => navigate("/login")}>
           כבר יש לך משתמש? <span>התחבר</span>
          </p>
        </div>
      </form>
    </div>
  );
}
