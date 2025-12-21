import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload(); // מאפס socket + state
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">Matan Amram EduPlay</div>

      <div className="nav-links">
        {isLoggedIn ? (
          <>
            <Link to="/my-quizzes">החידונים שלי</Link>
            <Link to="/create-quiz">יצירת חידון</Link>
            <Link to="/join-room">הצטרפות לחדר</Link>

            <button className="logout-btn" onClick={handleLogout}>
              התנתקות
            </button>
          </>
        ) : (
          <>
            <Link to="/login">התחברות</Link>
            <Link to="/register">הרשמה</Link>
            <Link to="/join-room">הצטרפות לחדר</Link>
          </>
        )}
      </div>
    </nav>
  );
}
