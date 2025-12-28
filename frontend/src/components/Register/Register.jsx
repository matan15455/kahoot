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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");

  const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone) =>
    /^(\+972|0)?5\d{8}$/.test(phone);

  const isValidBirthday = (birthday) => {
    if (!birthday) return true;
    const date = new Date(birthday);
    return !isNaN(date.getTime()) && date <= new Date();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !username ||
      !password ||
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !birthday
    ) {
      setError("אנא מלא את כל שדות החובה");
      return;
    }

    if (email && !isValidEmail(email)) {
      setError("אימייל לא תקין");
      return;
    }

    if (phone && !isValidPhone(phone)) {
      setError("מספר טלפון לא תקין");
      return;
    }

    if (!isValidBirthday(birthday)) {
      setError("תאריך לידה לא תקין");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Register
      await axios.post("http://localhost:5000/auth/register", {
        username,
        password,
        firstName,
        lastName,
        email,
        phone,
        birthday
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
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder=" "
            />
            <label className="auth-label">שם פרטי *</label>
            <span className="input-ring" />
          </div>

          <div className="input-group">
            <input
              className="auth-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder=" "
            />
            <label className="auth-label">שם משפחה *</label>
            <span className="input-ring" />
          </div>

          <div className="input-group">
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
            />
            <label className="auth-label">שם משתמש *</label>
            <span className="input-ring" />
          </div>

          <div className="input-group">
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
            />
            <label className="auth-label">סיסמה *</label>
            <span className="input-ring" />
          </div>

          <div className="input-group">
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
            />
            <label className="auth-label">אימייל *</label>
            <span className="input-ring" />
          </div>

          <div className="input-group">
            <input
              className="auth-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=" "
            />
            <label className="auth-label">טלפון *</label>
            <span className="input-ring" />
          </div>

          <div className="input-group">
            <input
              className="auth-input"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
            <label className="auth-label">תאריך לידה *</label>
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
