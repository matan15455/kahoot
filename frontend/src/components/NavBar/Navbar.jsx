import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">Matan Amram EduPlay</div>

      <div className="nav-links">
        <Link to="/my-quizzes">החידונים שלי</Link>
        <Link to="/create-quiz">יצירת חידון</Link>
        <Link to="/join-room">הצטרפות לחדר</Link>
      </div>
    </nav>
  );
}
