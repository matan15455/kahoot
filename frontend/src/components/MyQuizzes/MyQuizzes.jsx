import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./MyQuizzes.css";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get("http://localhost:5000/quizzes/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizzes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress color="secondary" size={80} />
      </Box>
    );
  }

  return (
    <div className="tk-page">
      {/* Background decoration */}
      <div className="tk-bg-blob tk-bg-blob--a" />
      <div className="tk-bg-blob tk-bg-blob--b" />

      <main className="tk-main">

        {/* Stats Bento */}
        <section className="tk-bento">
          {/* Welcome hero tile */}
          <div className="tk-bento-hero">
            <div className="tk-bento-hero__inner">
              <p className="tk-bento-hero__greeting">ברוך הבא, מאסטר!</p>
              <h2 className="tk-bento-hero__title">האימפריה שלך גדלה.</h2>
              <button
                className="tk-bento-hero__btn"
                onClick={() => navigate("/create-quiz")}
              >
                ✦ צור חידון חדש
              </button>
            </div>
            <div className="tk-bento-hero__circle tk-bento-hero__circle--1" />
            <div className="tk-bento-hero__circle tk-bento-hero__circle--2" />
          </div>

          {/* Stat tile – total */}
          <div className="tk-stat-tile">
            <div className="tk-stat-tile__top">
              <span className="tk-stat-tile__icon tk-stat-tile__icon--primary">📋</span>
              <span className="tk-stat-tile__badge tk-stat-tile__badge--green">סה"כ</span>
            </div>
            <span className="tk-stat-tile__num">{quizzes.length}</span>
            <span className="tk-stat-tile__label">חידונים שנוצרו</span>
          </div>

          {/* Stat tile – questions */}
          <div className="tk-stat-tile">
            <div className="tk-stat-tile__top">
              <span className="tk-stat-tile__icon tk-stat-tile__icon--teal">❓</span>
              <span className="tk-stat-tile__badge tk-stat-tile__badge--teal">שאלות</span>
            </div>
            <span className="tk-stat-tile__num">
              {quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0)}
            </span>
            <span className="tk-stat-tile__label">שאלות בסך הכל</span>
          </div>
        </section>

        {/* Header row */}
        <div className="tk-list-header">
          <div>
            <h2 className="tk-list-title">החידונים שלי</h2>
            <p className="tk-list-sub">
              {quizzes.length > 0
                ? `${quizzes.length} חידונים פעילים`
                : "עדיין לא יצרת חידונים"}
            </p>
          </div>
          <button
            className="tk-new-btn"
            onClick={() => navigate("/create-quiz")}
          >
            <span className="tk-new-btn__plus">+</span>
            חדש
          </button>
        </div>

        {/* Quiz Grid */}
        {quizzes.length === 0 ? (
          <div className="tk-empty">
            <div className="tk-empty-icon">🎯</div>
            <p className="tk-empty-text">עדיין אין חידונים</p>
            <button
              className="tk-empty-btn"
              onClick={() => navigate("/create-quiz")}
            >
              צור את הראשון
            </button>
          </div>
        ) : (
          <section className="tk-grid">
            {quizzes.map((quiz, idx) => (
              <QuizCard
                key={quiz._id}
                quiz={quiz}
                idx={idx}
                onPlay={() => navigate(`/create-room?quizId=${quiz._id}`)}
              />
            ))}

            {/* New Quiz Card */}
            <button
              className="tk-card tk-card--new"
              onClick={() => navigate("/create-quiz")}
            >
              <div className="tk-card-new__icon">+</div>
              <span className="tk-card-new__label">צור חידון חדש</span>
              <p className="tk-card-new__sub">התחל מאפס או עם AI</p>
            </button>
          </section>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="tk-bottom-nav">
        <NavItem icon="🏠" label="בית" active />
        <NavItem icon="🔍" label="גלה" />
        <div className="tk-fab" onClick={() => navigate("/create-quiz")}>+</div>
        <NavItem icon="📚" label="ספריה" />
        <NavItem icon="👤" label="פרופיל" onClick={() => navigate("/profile")} />
      </nav>
    </div>
  );
}

function QuizCard({ quiz, idx, onPlay }) {
  const colors = [
    { bg: "#811cd9", tag: "Tech & Gaming" },
    { bg: "#006571", tag: "Pop Culture" },
    { bg: "#495500", tag: "ידע כללי" },
    { bg: "#b41340", tag: "מדע" },
  ];
  const color = colors[idx % colors.length];

  return (
    <div className="tk-card" style={{ "--card-accent": color.bg }}>
      {/* Color header */}
      <div className="tk-card__header" style={{ background: color.bg }}>
        <span className="tk-card__tag">{color.tag}</span>
        <span className="tk-card__count">{quiz.questions?.length || 0} שאלות</span>
        <div className="tk-card__header-shine" />
      </div>

      {/* Body */}
      <div className="tk-card__body">
        <h3 className="tk-card__title">{quiz.title}</h3>
        <p className="tk-card__desc">
          {quiz.description || "ללא תיאור"}
        </p>
        <div className="tk-card__meta">
          <span className="tk-card__meta-item">▶ {quiz.plays || 0} משחקים</span>
          <span className="tk-card__meta-item">⏱ {Math.ceil((quiz.questions?.length || 1) * 0.5)}m</span>
        </div>
      </div>

      {/* Footer */}
      <div className="tk-card__footer">
        <div className="tk-card__actions">
          <button className="tk-card__icon-btn" title="ערוך" onClick={() => {}}>✏️</button>
          <button className="tk-card__icon-btn tk-card__icon-btn--danger" title="מחק" onClick={() => {}}>🗑</button>
        </div>
        <button className="tk-card__play-btn" onClick={onPlay}>
          ▶ שחק Live
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div
      className={`tk-nav-item ${active ? "tk-nav-item--active" : ""}`}
      onClick={onClick}
    >
      <span className="tk-nav-item__icon">{icon}</span>
      <span className="tk-nav-item__label">{label}</span>
    </div>
  );
}