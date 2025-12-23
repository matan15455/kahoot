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
      <div className="nav-logo">Matan Amram EduPlay</div>

      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/my-quizzes">החידונים שלי</Link>
            <Link to="/create-quiz">יצירת חידון</Link>
            <Link to="/join-room">הצטרף לחדר</Link>

            <button className="logout-btn" onClick={handleLogout}>
              התנתק
            </button>
          </>
        ) : (
          <>
            <Link to="/login">התחבר</Link>
            <Link to="/register">הירשם</Link>
            <Link to="/join-room">הצטרף לחדר</Link>
          </>
        )}
      </div>
    </nav>
  );
}
