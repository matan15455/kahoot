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

  const allowedPlatforms = [
    "gmail.com",
    "gmail.co.il",
    "outlook.com",
    "outlook.co.il",
    "walla.com",
    "walla.co.il",
    "hotmail.com",
    "hotmail.co.il",
    "yahoo.com",
    "yahoo.co.il",
    "icloud.com"
  ];


  // פונקציה לבדיקת תקינות אימייל
  const isValidEmail = (email) => {
    if (!email) return false;

    // בדיקה בסיסית למבנה אימייל
    const basicCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!basicCheck) return false;

    const domain = email.split("@")[1].toLowerCase();

    return allowedPlatforms.includes(domain);
  };

  //פונקציה לבדיקת תקינות טלפון
  const isValidPhone = (phone) =>
    /^(\+972|0)?-?5\d-?\d{7}$/.test(phone);

  //פונקציה לבדיקת גיל (מעל 21)
  const isAdult21 = (birthday) => {
    const birth = new Date(birthday);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    return age > 21 || (age === 21 && m >= 0);
  };

  //בדיקת תקינות סיסמה (לפי הדרישות של אלון)
  const isValidPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);

  //טיפול בהגשת טופס ההרשמה
  const handleSubmit = async (e) => {
    //מונע מהדפדפן לרענן את הדף ולמחוק את הSTATES
    e.preventDefault();

    //מנקה את השגיאה הקודמת
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
      setError("יש למלא את כל השדות");
      return;
    }

    if (!isValidEmail(email)) {
      setError("אימייל לא תקין");
      return;
    }

    if (!isValidPhone(phone)) {
      setError("מספר טלפון לא תקין");
      return;
    }

    if (!isAdult21(birthday)) {
      setError("המשתמש חייב להיות מעל גיל 21");
      return;
    }

    if (!isValidPassword(password)) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה, ספרה ותו מיוחד");
      return;
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:5000/auth/register", {
        username,
        password,
        firstName,
        lastName,
        email,
        phone,
        birthday
      });

      // התחברות אוטומטית אחרי הרשמה
      const res = await axios.get("http://localhost:5000/auth/login", {
        params: {
          username,
          password
        }
      });

      // שומר את הטוקן
      login({ token: res.data.token });

      // עובר לעמוד "חידונים שלי
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
