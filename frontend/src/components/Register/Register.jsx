import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { isValidPassword } from "../../utils/validators";
import { EpBrandMark, EpShape } from "../_shared/EpBrand";

import "./Register.css";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  //טיפול בהגשת טופס ההרשמה
  const handleSubmit = async (e) => {
    //מונע מהדפדפן לרענן את הדף ולמחוק את הSTATES
    e.preventDefault();

    //מנקה את השגיאה הקודמת
    setError("");

    if (!username || !password || !confirmPassword) {
      setError("יש למלא שם משתמש וסיסמה");
      return;
    }

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:5000/auth/register", {
        username,
        password
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
            <h1 className="ep-reg__hero">
             למידה<br />
             <span className="ep-reg__hero-accent">בכיף</span>
            </h1>
            <p className="ep-reg__lead">
             הירשם כדי ליצור חידונים, להפעיל אותם בזמן אמת ולעקוב אחר סטטיסטיקות המשחק.
            </p>
          </div>

          <ul className="ep-login__chips">
            <li className="ep-login__chip">
              <span style={{ color: "var(--ep-ans-1)" }}>
                <EpShape kind="burst" size={14} />
              </span>
              חידונים מבוססי AI
            </li>
            <li className="ep-login__chip">
              <span style={{ color: "var(--ep-ans-3)" }}>
                <EpShape kind="plus" size={14} />
              </span>
              סטטיסטיקות
            </li>
            <li className="ep-login__chip">
              <span style={{ color: "var(--ep-ans-4)" }}>
                <EpShape kind="wave" size={14} />
              </span>
              זמן אמת
            </li>
          </ul>
        </aside>

        {/* ── צד ימין: טופס ── */}
        <main className="ep-reg__form-wrap">
          <form className="ep-reg__form" onSubmit={handleSubmit} noValidate>
            <div className="ep-reg__form-top">
              <p className="ep-reg__form-kicker">הרשמה</p>
              <h2 className="ep-reg__form-title">צור חשבון</h2>
            </div>

            <div className="ep-reg__fields">

              {/* שם משתמש */}
              <div className="ep-field">
                <label className="ep-field__label" htmlFor="reg-username">שם משתמש</label>
                <input
                  id="reg-username"
                  className="ep-field__input"
                  type="text"
                  autoComplete="username"
                  placeholder="בחרו שם משתמש"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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

              {/* אימות סיסמה */}
              <div className="ep-field">
                <label className="ep-field__label" htmlFor="reg-pwd-confirm">אימות סיסמה</label>
                <input
                  id="reg-pwd-confirm"
                  className="ep-field__input"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="הקלידו את הסיסמה שוב"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
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
