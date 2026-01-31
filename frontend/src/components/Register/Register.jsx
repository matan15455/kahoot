import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {isValidEmail,isValidPhone,isAdult21,isValidPassword,isValidID} from "../../utils/validators";

import "./Register.css";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [idUser, setIdUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");

  //טיפול בהגשת טופס ההרשמה
  const handleSubmit = async (e) => {
    //מונע מהדפדפן לרענן את הדף ולמחוק את הSTATES
    e.preventDefault();

    //מנקה את השגיאה הקודמת
    setError("");

    if (
      !idUser ||
      !password ||
      !name ||
      !email ||
      !phone ||
      !birthday
    ) {
      setError("יש למלא את כל השדות");
      return;
    }

    // if (!isValidID(idUser)) {
    //   setError("תעודת זהות לא תקינה");
    //   return;
    // }

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
        id: idUser,
        password,
        name,
        email,
        phone,
        birthday
      });

      // התחברות אוטומטית אחרי הרשמה
      const res = await axios.get("http://localhost:5000/auth/login", {
        params: {
          id: idUser,
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
              value={idUser}
              onChange={(e) => setIdUser(e.target.value)}
              placeholder=" "
            />
            <label className="auth-label">תעודת זהות *</label>
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
            <input className="auth-input"
                type="text"
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder=" " />
            <label className="auth-label">שם מלא *</label>
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
