import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { EpLogo } from "../_shared/EpBrand";
import { useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const location = useLocation();

  const hideNavbar =
    location.pathname === "/host/game" ||
    location.pathname === "/player/game";

  if (hideNavbar) 
    return null;

  const handleLogout = () => {
    const confirmLogout = window.confirm("⚠️ בטוח שאתה רוצה להתנתק?");
    if (!confirmLogout)
      return;
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    "ep-nav__link" + (isActive ? " is-active" : "");

  return (
    <nav className="ep-nav">
      <div className="ep-nav__inner">

        {/* ── מותג ── */}
        <NavLink to="/" className="ep-nav__brand" end>
          <EpLogo size={32} />
          <span className="ep-nav__brand-wordmark">
            EduPlay
            <span className="ep-nav__brand-credit">by Matan Amram</span>
          </span>
        </NavLink>

        {/* ── קישורים ── */}
        <div className="ep-nav__links">
          {isAuthenticated ? (
            <>
              <NavLink className={linkClass} to="/my-quizzes">החידונים שלי</NavLink>
              <NavLink className={linkClass} to="/create-quiz">יצירת חידון</NavLink>
              <NavLink className={linkClass} to="/join-room">הצטרף לחדר</NavLink>
              <NavLink className={linkClass} to="/statistics">סטטיסטיקות</NavLink>
              <NavLink className={linkClass} to="/profile">איזור אישי</NavLink>

              <span className="ep-nav__divider" aria-hidden="true" />

              <button className="ep-nav__logout" onClick={handleLogout}>
                התנתק
              </button>
            </>
          ) : (
            <>
              <NavLink className={linkClass} to="/join-room">הצטרף לחדר</NavLink>

              <span className="ep-nav__divider" aria-hidden="true" />

              <NavLink className="ep-nav__link ep-nav__link--ghost" to="/login">
                התחבר
              </NavLink>
              <NavLink className="ep-nav__cta" to="/register">
                הרשמה
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
