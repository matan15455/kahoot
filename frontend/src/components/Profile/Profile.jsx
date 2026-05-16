import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  isValidEmail,
  isValidPhone,
  isAdult21,
  isValidPassword,
} from "../../utils/validators";
import { EpShape } from "../_shared/EpBrand";
import "./Profile.css";

export default function Profile() {
  const { token, userId, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: "",
    password: "",
    id: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone,
          birthday: res.data.birthday,
          password: "",
          id: res.data.id,
        });
      } catch (err) {
        setError(err.response?.data?.message || "שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, userId]);

  const handleChange = (e) => {
    setUserData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleUpdate = async () => {
    if (!userId) return;
    setError("");

    if (!isValidEmail(userData.email)) { setError("אימייל לא תקין"); return; }
    if (!isValidPhone(userData.phone)) { setError("מספר טלפון לא תקין"); return; }
    if (!isAdult21(userData.birthday)) { setError("המשתמש חייב להיות מעל גיל 21"); return; }
    if (userData.password && !isValidPassword(userData.password)) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה, ספרה ותו מיוחד");
      return;
    }

    const updates = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      birthday: userData.birthday,
    };
    if (userData.password) updates.password = userData.password;

    try {
      setSaving(true);
      await axios.patch(`http://localhost:5000/user/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      setUserData((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בעדכון");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה במחיקה");
      setLoading(false);
    }
  };

  /* ── Loading ── */
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

  const initials = userData.name
    ? userData.name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2)
    : "?";

  return (
    <div className="ep-prof">
      <div className="ep-prof__container">

        {/* ══ כרטיס כותרת — Avatar + שם + ת.ז ══ */}
        <div className="ep-prof__hero">
          {/* בלובים דקורטיביים */}
          <span className="ep-prof__blob ep-prof__blob--a" aria-hidden="true" />
          <span className="ep-prof__blob ep-prof__blob--b" aria-hidden="true" />

          <div className="ep-prof__avatar-wrap">
            <div className="ep-prof__avatar">{initials}</div>
            <div className="ep-prof__avatar-ring" aria-hidden="true" />
          </div>

          <div className="ep-prof__hero-body">
            <p className="ep-prof__hero-label">האזור האישי שלך</p>
            <h1 className="ep-prof__hero-name">{userData.name || "—"}</h1>
            <div className="ep-prof__id-badge">
              <span className="ep-prof__id-label">ת.ז.</span>
              <span className="ep-prof__id-value">{userData.id}</span>
            </div>
          </div>

          {/* צורות גיאומטריות דקורטיביות */}
          <span className="ep-prof__deco ep-prof__deco--1" aria-hidden="true">
            <EpShape kind="burst" size={28} color="var(--ep-ans-3)" />
          </span>
          <span className="ep-prof__deco ep-prof__deco--2" aria-hidden="true">
            <EpShape kind="plus" size={20} color="rgba(255,255,255,0.3)" />
          </span>
        </div>

        {/* ══ Toast הצלחה ══ */}
        {success && (
          <div className="ep-prof__toast" role="status">
            <span className="ep-prof__toast-icon">✓</span>
            הפרטים עודכנו בהצלחה!
          </div>
        )}

        {/* ══ שגיאה ══ */}
        {error && (
          <div className="ep-prof__error" role="alert">
            <span className="ep-prof__error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* ══ טופס פרטים ══ */}
        <section className="ep-prof__card">
          <div className="ep-prof__section-head">
            <span className="ep-prof__section-kicker">פרטי חשבון</span>
            <h2 className="ep-prof__section-title">עריכת פרטים</h2>
          </div>

          <div className="ep-prof__fields">

            {/* שם */}
            <div className="ep-field">
              <label className="ep-field__label" htmlFor="prof-name">שם מלא</label>
              <input
                id="prof-name"
                name="name"
                className="ep-field__input"
                type="text"
                placeholder="שם מלא"
                value={userData.name || ""}
                onChange={handleChange}
              />
            </div>

            {/* אימייל + טלפון */}
            <div className="ep-prof__row-2">
              <div className="ep-field">
                <label className="ep-field__label" htmlFor="prof-email">אימייל</label>
                <input
                  id="prof-email"
                  name="email"
                  className="ep-field__input"
                  type="email"
                  placeholder="name@example.com"
                  value={userData.email || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="ep-field">
                <label className="ep-field__label" htmlFor="prof-phone">טלפון</label>
                <input
                  id="prof-phone"
                  name="phone"
                  className="ep-field__input"
                  type="tel"
                  placeholder="05X-XXXXXXX"
                  value={userData.phone || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* תאריך לידה */}
            <div className="ep-field">
              <label className="ep-field__label" htmlFor="prof-bday">תאריך לידה</label>
              <input
                id="prof-bday"
                name="birthday"
                className="ep-field__input"
                type="date"
                value={userData.birthday || ""}
                onChange={handleChange}
              />
            </div>

            {/* סיסמה */}
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
                לפחות 8 תווים, אות גדולה, ספרה ותו מיוחד
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
                <span className="ep-prof__save-arrow" aria-hidden="true">←</span>
              </>
            )}
          </button>
        </section>

        {/* ══ אזור מחיקה ══ */}
        <section className="ep-prof__danger">
          <div className="ep-prof__danger-body">
            <h3 className="ep-prof__danger-title">מחיקת חשבון</h3>
            <p className="ep-prof__danger-desc">
              פעולה זו בלתי הפיכה — כל החידונים והנתונים שלך יימחקו לצמיתות.
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