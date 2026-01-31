import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();              // מנקה context + localStorage
    navigate("/login");    // מעבר למסך התחברות
    window.location.reload(); // (אופציונלי – מאפס socket)
  };

  return (
    <nav className="navbar">
      <div className="navbar-blur" />

      <div className="navbar-inner">
        {/* LOGO */}
        <div className="nav-logo">
          <span className="logo-glow">Matan Amram</span>
          <span className="logo-sub">EduPlay</span>
        </div>

        {/* LINKS */}
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <Link className="nav-link" to="/my-quizzes">החידונים שלי</Link>
              <Link className="nav-link" to="/create-quiz">יצירת חידון</Link>
              <Link className="nav-link" to="/join-room">הצטרף לחדר</Link>
              <Link className="nav-link" to="/profile">איזור אישי</Link>

              <button className="logout-btn" onClick={handleLogout}>
                התנתק
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">התחבר</Link>
              <Link className="nav-link" to="/register">הירשם</Link>
              <Link className="nav-link" to="/join-room">הצטרף לחדר</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
