import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { isValidPassword } from "../../utils/validators";
import { EpShape } from "../_shared/EpBrand";
import "./Profile.css";

export default function Profile() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    currentPassword: "",
    password: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!username) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/user/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData({
          currentPassword: "",
          password: "",
          username: res.data.username,
        });
      } catch (err) {
        setError(err.response?.data?.message || "שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, username]);

  const handleChange = (e) => {
    setUserData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleUpdate = async () => {
    if (!username) return;
    setError("");

    if (!userData.password) {
      setError("אין שינוי לשמירה");
      return;
    }

    if (!userData.currentPassword) {
      setError("יש להזין את הסיסמה הנוכחית");
      return;
    }

    if (!isValidPassword(userData.password)) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים, אות אחת וספרה אחת");
      return;
    }

    const updates = {
      password: userData.password,
      currentPassword: userData.currentPassword,
    };

    try {
      setSaving(true);
      await axios.patch(`http://localhost:5000/user/${username}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      setUserData((prev) => ({ ...prev, password: "", currentPassword: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בעדכון");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!username) return;
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/user/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה במחיקה");
      setLoading(false);
    }
  };

  /*  Loading  */
  if (loading) {
    return (
      <div className="ep-prof ep-prof--state">
        <div className="ep-prof__loader">
          <div className="ep-prof__spinner" />
          <p className="ep-prof__loader-text">טוען פרטים…</p>
        </div>
      </div>
    );
  }

  const initials = userData.username ? userData.username.trim().slice(0, 2).toUpperCase() : "?";

  return (
    <div className="ep-prof">
      <div className="ep-prof__container">

        <div className="ep-prof__hero">
          <span className="ep-prof__blob ep-prof__blob--a" aria-hidden="true" />
          <span className="ep-prof__blob ep-prof__blob--b" aria-hidden="true" />

          <div className="ep-prof__avatar-wrap">
            <div className="ep-prof__avatar">{initials}</div>
            <div className="ep-prof__avatar-ring" aria-hidden="true" />
          </div>

          <div className="ep-prof__hero-body">
            <p className="ep-prof__hero-label">האזור האישי שלך</p>
            <h1 className="ep-prof__hero-name">{userData.username || "—"}</h1>
          </div>

          <span className="ep-prof__deco ep-prof__deco--1" aria-hidden="true">
            <EpShape kind="burst" size={28} color="var(--ep-ans-3)" />
          </span>
          <span className="ep-prof__deco ep-prof__deco--2" aria-hidden="true">
            <EpShape kind="plus" size={20} color="rgba(255,255,255,0.3)" />
          </span>
        </div>

        {/*  Toast הצלחה  */}
        {success && (
          <div className="ep-prof__toast" role="status">
            <span className="ep-prof__toast-icon">✓</span>
            הסיסמה עודכנה בהצלחה!
          </div>
        )}

        {/*  שגיאה  */}
        {error && (
          <div className="ep-prof__error" role="alert">
            <span className="ep-prof__error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {/*  טופס פרטים  */}
        <section className="ep-prof__card">
          <div className="ep-prof__section-head">
            <span className="ep-prof__section-kicker">פרטי חשבון</span>
            <h2 className="ep-prof__section-title">שינוי סיסמה</h2>
          </div>

          <div className="ep-prof__fields">

            {/* שם משתמש (לקריאה בלבד) */}
            <div className="ep-field">
              <label className="ep-field__label" htmlFor="prof-username">שם משתמש</label>
              <input
                id="prof-username"
                className="ep-field__input"
                type="text"
                value={userData.username || ""}
                disabled
              />
            </div>

            {/* סיסמה נוכחית (נדרש רק אם משנים סיסמה) */}
            <div className="ep-field">
              <label className="ep-field__label" htmlFor="prof-current-pwd">סיסמה נוכחית</label>
              <input
                id="prof-current-pwd"
                name="currentPassword"
                className="ep-field__input"
                type="password"
                placeholder="הזן את הסיסמה הנוכחית שלך"
                value={userData.currentPassword || ""}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            {/* סיסמה חדשה */}
            <div className="ep-field">
              <div className="ep-field__label-row">
                <label className="ep-field__label" htmlFor="prof-pwd">סיסמה חדשה</label>
                <button
                  type="button"
                  className="ep-field__toggle"
                  onClick={() => setShowPwd((s) => !s)}
                >
                  {showPwd ? "הסתר" : "הצג"}
                </button>
              </div>
              <input
                id="prof-pwd"
                name="password"
                className="ep-field__input"
                type={showPwd ? "text" : "password"}
                placeholder="השאר ריק אם אין שינוי"
                value={userData.password || ""}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <p className="ep-field__hint">
                הסיסמה חייבת להכיל לפחות 8 תווים, אות אחת וספרה אחת
              </p>
            </div>
          </div>

          <button
            className={`ep-prof__save ${saving ? "is-loading" : ""}`}
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <span className="ep-prof__spin" aria-label="שומר" />
            ) : (
              <>
                <span>שמור שינויים</span>
              </>
            )}
          </button>
        </section>

        {/*  אזור מחיקה  */}
        <section className="ep-prof__danger">
          <div className="ep-prof__danger-body">
            <h3 className="ep-prof__danger-title">מחיקת חשבון</h3>
            <p className="ep-prof__danger-desc">
              כל החידונים והנתונים שלך יימחקו לצמיתות.
            </p>
          </div>

          {!confirmDelete ? (
            <button
              className="ep-prof__del-btn"
              onClick={() => setConfirmDelete(true)}
            >
              מחק חשבון
            </button>
          ) : (
            <div className="ep-prof__confirm">
              <p className="ep-prof__confirm-q">בטוח לחלוטין?</p>
              <div className="ep-prof__confirm-actions">
                <button
                  className="ep-prof__confirm-yes"
                  onClick={handleDelete}
                >
                  כן, מחק
                </button>
                <button
                  className="ep-prof__confirm-no"
                  onClick={() => setConfirmDelete(false)}
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}