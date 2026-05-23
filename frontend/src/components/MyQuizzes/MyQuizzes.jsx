import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import QuizCard from "../QuizCard/QuizCard";
import CircularProgress from "@mui/material/CircularProgress";
import { EpShape } from "../_shared/EpBrand";
import "./MyQuizzes.css";

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/quizzes/my",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setQuizzes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [token]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="ep-myq ep-myq--state">
        <div className="ep-myq__loader">
          <CircularProgress sx={{ color: "var(--ep-primary)" }} size={56} />
          <p className="ep-myq__loader-text">טוען את הספרייה שלך…</p>
        </div>
      </div>
    );
  }

  const count = quizzes.length;
  const totalQuestions = quizzes.reduce(
    (sum, q) => sum + (q.questions?.length || 0),
    0
  );

  const handleDelete = async (quizId) => {
      if (!window.confirm("למחוק את החידון לצמיתות?")) return;
      try {
        await axios.delete(`http://localhost:5000/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuizzes(quizzes.filter(q => q._id !== quizId));
      } catch (err) {
        console.error(err);
        alert("שגיאה במחיקה");
      }
  };

  return (
    <div className="ep-myq">

      {/* ── כותרת ── */}
      <header className="ep-myq__head">
        <div className="ep-myq__head-text">
          <p className="ep-myq__kicker">
            הספרייה שלך
            {count > 0 && (
              <>
                {" · "}
                <span className="ep-myq__kicker-stat">
                  {count} {count === 1 ? "חידון" : "חידונים"}
                </span>
                {totalQuestions > 0 && (
                  <>
                    {" · "}
                    <span className="ep-myq__kicker-stat">
                      {totalQuestions} שאלות
                    </span>
                  </>
                )}
              </>
            )}
          </p>
          <h1 className="ep-myq__title">החידונים שלי</h1>
        </div>

        {count > 0 && (
          <button
            className="ep-myq__cta"
            onClick={() => navigate("/create-quiz")}
          >
            <span className="ep-myq__cta-plus">+</span>
            חידון חדש
          </button>
        )}
      </header>

      {/* ── תוכן ── */}
      {count === 0 ? (
        <div className="ep-myq__empty">
          <div className="ep-myq__empty-art" aria-hidden="true">
            <span className="ep-myq__empty-shape ep-myq__empty-shape--1">
              <EpShape kind="burst" size={40} color="var(--ep-ans-1)" />
            </span>
            <span className="ep-myq__empty-shape ep-myq__empty-shape--2">
              <EpShape kind="hex" size={50} color="var(--ep-ans-2)" />
            </span>
            <span className="ep-myq__empty-shape ep-myq__empty-shape--3">
              <EpShape kind="plus" size={36} color="var(--ep-ans-3)" />
            </span>
            <span className="ep-myq__empty-shape ep-myq__empty-shape--4">
              <EpShape kind="wave" size={44} color="var(--ep-ans-4)" />
            </span>
          </div>
          <h2 className="ep-myq__empty-title">
            אין כאן עדיין חידונים
          </h2>
          <p className="ep-myq__empty-sub">
            צרו את החידון הראשון שלכם ב-2 דקות —
            ידנית עם 4 תשובות לשאלה, או בעזרת בינה מלאכותית.
          </p>
          <div className="ep-myq__empty-actions">
            <button
              className="ep-myq__cta"
              onClick={() => navigate("/create-quiz")}
            >
              <span className="ep-myq__cta-plus">+</span>
              צרו חידון ראשון
            </button>
            <button
              className="ep-myq__cta ep-myq__cta--ghost"
              onClick={() => navigate("/join-room")}
            >
              או הצטרפו לחדר של חבר
            </button>
          </div>
        </div>
      ) : (
        <div className="ep-myq__grid">
          {quizzes.map((quiz, idx) => (
            <QuizCard key={quiz._id} quiz={quiz} colorIndex={idx} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
