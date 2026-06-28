import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { EpBrandMark, EpShape } from "../_shared/EpBrand";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

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
          username,
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
    <div className="ep-login">
      <div className="ep-login__grid">

        {/* ── צד שמאל: מותג + הצהרת ערך ── */}
        <aside className="ep-login__brand">
          {/* כתמי רקע דקורטיביים */}
          <span className="ep-login__blob ep-login__blob--a" aria-hidden="true" />
          <span className="ep-login__blob ep-login__blob--b" aria-hidden="true" />

          <div className="ep-login__brand-top">
            <EpBrandMark />
          </div>

          <div className="ep-login__brand-body">
            <h1 className="ep-login__hero">
              למידה<br />
              <span className="ep-login__hero-accent">בכיף</span>
            </h1>
            <p className="ep-login__lead">
             התחבר כדי ליצור חידונים, להפעיל אותם בזמן אמת ולעקוב אחר סטטיסטיקות המשחק.
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
              משחק עם חברים
            </li>
          </ul>
        </aside>

        {/* ── צד ימין: טופס ── */}
        <main className="ep-login__form-wrap">
          <form className="ep-login__form" onSubmit={handleSubmit} noValidate>
            <div className="ep-login__form-top">
              <p className="ep-login__form-kicker">התחברות</p>
              <h2 className="ep-login__form-title">ברוכים השבים</h2>
              <p className="ep-login__form-sub">הזן שם משתמש וסיסמה כדי להמשיך</p>
            </div>

            <div className="ep-login__fields">
              <div className="ep-field">
                <label className="ep-field__label" htmlFor="login-username">שם משתמש</label>
                <input
                  id="login-username"
                  className="ep-field__input"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="הזן שם משתמש"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="ep-field">
                <div className="ep-field__label-row">
                  <label className="ep-field__label" htmlFor="login-pwd">סיסמה</label>
                  <button
                    type="button"
                    className="ep-field__toggle"
                    onClick={() => setShowPwd(s => !s)}
                  >
                    {showPwd ? "הסתר" : "הצג"}
                  </button>
                </div>
                <input
                  id="login-pwd"
                  className="ep-field__input"
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="ep-login__error" role="alert" aria-live="polite">
                  <span className="ep-login__error-icon">!</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button className="ep-login__submit" type="submit">
              <span>התחבר</span>
            </button>

            <div className="ep-login__divider">
              <span /><p>או</p><span />
            </div>

            <p className="ep-login__footer">
              חדש כאן?{" "}
              <Link to="/register" className="ep-login__link ep-login__link--primary">
                צור חשבון
              </Link>
              {"  ·  "}
              <Link to="/join-room" className="ep-login__link">
                הצטרפו לחדר ללא הרשמה
              </Link>
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
