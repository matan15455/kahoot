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
            <Link to="/my-quizzes">My Quizzes</Link>
            <Link to="/create-quiz">Create Quiz</Link>
            <Link to="/join-room">Join Room</Link>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/join-room">Join Room</Link>
          </>
        )}
      </div>
    </nav>
  );
}
