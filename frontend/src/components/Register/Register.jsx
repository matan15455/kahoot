import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  isValidEmail,
  isValidPhone,
  isAdult21,
  isValidPassword,
  isValidID
} from "../../utils/validators";
import { EpBrandMark, EpShape } from "../_shared/EpBrand";

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
  const [showPwd, setShowPwd] = useState(false);

  //טיפול בהגשת טופס ההרשמה
  const handleSubmit = async (e) => {
    //מונע מהדפדפן לרענן את הדף ולמחוק את הSTATES
    e.preventDefault();

    //מנקה את השגיאה הקודמת
    setError("");

    if (!idUser || !password || !name || !email || !phone || !birthday) {
      setError("יש למלא את כל השדות");
      return;
    }

    // if (!isValidID(idUser)) {
    //   setError("תעודת זהות לא תקינה");
    //   return;
    // }

    // if (!isValidEmail(email)) {
    //   setError("אימייל לא תקין");
    //   return;
    // }

    // if (!isValidPhone(phone)) {
    //   setError("מספר טלפון לא תקין");
    //   return;
    // }

    // if (!isAdult21(birthday)) {
    //   setError("המשתמש חייב להיות מעל גיל 21");
    //   return;
    // }

    // if (!isValidPassword(password)) {
    //   setError("הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה, ספרה ותו מיוחד");
    //   return;
    // }

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
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ep-reg">
      <div className="ep-reg__grid">

        {/* ── צד שמאל: מותג ── */}
        <aside className="ep-reg__brand">
          <span className="ep-reg__blob ep-reg__blob--a" aria-hidden="true" />
          <span className="ep-reg__blob ep-reg__blob--b" aria-hidden="true" />

          <div className="ep-reg__brand-top">
            <EpBrandMark />
          </div>

          <div className="ep-reg__brand-body">
            <p className="ep-reg__kicker">
              <span className="ep-reg__kicker-dot" />
              הצטרפו לקהילה
            </p>
            <h1 className="ep-reg__hero">
              שני דקות להרשמה,<br />
              שנים של <span className="ep-reg__hero-accent">חידונים.</span>
            </h1>
            <p className="ep-reg__lead">
              חשבון EduPlay בחינם פותח את כל הפלטפורמה —
              יצירת חידונים, ניהול חדרים בזמן אמת, וצפייה בסטטיסטיקות אחרי כל משחק.
            </p>
          </div>

          <ul className="ep-reg__chips">
            <li className="ep-reg__chip">
              <span style={{ color: "var(--ep-ans-1)" }}>
                <EpShape kind="burst" size={14} />
              </span>
              חינם לחלוטין
            </li>
            <li className="ep-reg__chip">
              <span style={{ color: "var(--ep-ans-3)" }}>
                <EpShape kind="plus" size={14} />
              </span>
              ללא הגבלת חידונים
            </li>
            <li className="ep-reg__chip">
              <span style={{ color: "var(--ep-ans-4)" }}>
                <EpShape kind="wave" size={14} />
              </span>
              עברית מלאה
            </li>
          </ul>
        </aside>

        {/* ── צד ימין: טופס ── */}
        <main className="ep-reg__form-wrap">
          <form className="ep-reg__form" onSubmit={handleSubmit} noValidate>
            <div className="ep-reg__form-top">
              <p className="ep-reg__form-kicker">הרשמה</p>
              <h2 className="ep-reg__form-title">יוצרים חשבון</h2>
              <p className="ep-reg__form-sub">כל השדות חובה · יידרשו 30 שניות</p>
            </div>

            <div className="ep-reg__fields">

              {/* שם מלא */}
              <div className="ep-field">
                <label className="ep-field__label" htmlFor="reg-name">שם מלא</label>
                <input
                  id="reg-name"
                  className="ep-field__input"
                  type="text"
                  autoComplete="name"
                  placeholder="לדוגמה: מתן עמרם"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* ת.ז + תאריך לידה — 2 עמודות */}
              <div className="ep-reg__row-2">
                <div className="ep-field">
                  <label className="ep-field__label" htmlFor="reg-id">תעודת זהות</label>
                  <input
                    id="reg-id"
                    className="ep-field__input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    placeholder="9 ספרות"
                    value={idUser}
                    onChange={(e) => setIdUser(e.target.value)}
                  />
                </div>
                <div className="ep-field">
                  <label className="ep-field__label" htmlFor="reg-bday">תאריך לידה</label>
                  <input
                    id="reg-bday"
                    className="ep-field__input"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
              </div>

              {/* אימייל */}
              <div className="ep-field">
                <label className="ep-field__label" htmlFor="reg-email">אימייל</label>
                <input
                  id="reg-email"
                  className="ep-field__input"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* טלפון */}
              <div className="ep-field">
                <label className="ep-field__label" htmlFor="reg-phone">טלפון</label>
                <input
                  id="reg-phone"
                  className="ep-field__input"
                  type="tel"
                  autoComplete="tel"
                  placeholder="05X-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* סיסמה */}
              <div className="ep-field">
                <div className="ep-field__label-row">
                  <label className="ep-field__label" htmlFor="reg-pwd">סיסמה</label>
                  <button
                    type="button"
                    className="ep-field__toggle"
                    onClick={() => setShowPwd(s => !s)}
                  >
                    {showPwd ? "הסתר" : "הצג"}
                  </button>
                </div>
                <input
                  id="reg-pwd"
                  className="ep-field__input"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="לפחות 8 תווים"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="ep-field__hint">
                  לפחות 8 תווים, אות גדולה, ספרה ותו מיוחד
                </p>
              </div>

              {error && (
                <div className="ep-reg__error" role="alert" aria-live="polite">
                  <span className="ep-reg__error-icon">!</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              className={"ep-reg__submit" + (loading ? " is-loading" : "")}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="ep-reg__loader" aria-label="טוען" />
              ) : (
                <>
                  <span>הירשם</span>
                  <span className="ep-reg__submit-arrow" aria-hidden="true">←</span>
                </>
              )}
            </button>

            <p className="ep-reg__footer">
              כבר יש לך חשבון?{" "}
              <Link to="/login" className="ep-reg__link">
                התחבר ←
              </Link>
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
