import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    const confirmLogout = window.confirm("⚠️ בטוח שאתה רוצה להתנתק?");
    if (!confirmLogout) 
      return;
    logout();              
    navigate("/login");    
    window.location.reload(); 
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
              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                to="/my-quizzes"
              >
                החידונים שלי
              </NavLink>

              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                to="/create-quiz"
              >
                יצירת חידון
              </NavLink>

              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                to="/join-room"
              >
                הצטרף לחדר
              </NavLink>

              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                to="/profile"
              >
                איזור אישי
              </NavLink>

              <button className="logout-btn" onClick={handleLogout}>
                התנתק
              </button>
            </>
          ) : (
            <>
              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                to="/login"
              >
                התחבר
              </NavLink>

              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                to="/register"
              >
                הירשם
              </NavLink>

              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                to="/join-room"
              >
                הצטרף לחדר
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
