import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import QuizForm from "../QuizForm/QuizForm";
import QuestionForm from "../QuestionForm/QuestionForm";
import CircularProgress from "@mui/material/CircularProgress";
import { EpShape, ANSWER_META } from "../_shared/EpBrand";
import axios from "axios";
import "./QuizCreator.css";

export default function QuizCreator() {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { token } = useAuth();

  const handleAddQuiz = (quizData) => setQuiz(quizData);

  const handleAddQuestion = (q) => {
    setQuestions([...questions, q]);
    setAddingQuestion(false);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!quiz)
      return alert("חסר חידון");
    if (questions.length === 0)
      return alert("הוסף לפחות שאלה אחת");

    try {
      setSaving(true);

      await axios.post(
        "http://localhost:5000/quizzes",
        {
          ...quiz,
          questions
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);

      setQuiz(null);
      setQuestions([]);
    } catch (err) {
      console.error(err);
      alert("שגיאה ביצירת החידון");
    }

    setSaving(false);
  };

  /* ============ Step 1: QuizForm (title + description) ============ */
  if (!quiz) {
    return (
      <div className="ep-qc">
        {success && (
          <div className="ep-qc__toast" role="status">
            <span className="ep-qc__toast-icon">✓</span>
            החידון נשמר בהצלחה
          </div>
        )}
        <QuizForm onAddQuiz={handleAddQuiz} />
      </div>
    );
  }

  /* ============ Step 2: Build questions ============ */
  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);
  const totalTime = questions.reduce((s, q) => s + (q.time || 0), 0);

  return (
    <div className="ep-qc">

      {/* ── כותרת ── */}
      <header className="ep-qc__head">
        <div className="ep-qc__head-text">
          <p className="ep-qc__kicker">
            עורך חידון · בנייה
          </p>
          <h1 className="ep-qc__title">{quiz.title}</h1>
          {quiz.description && (
            <p className="ep-qc__desc">{quiz.description}</p>
          )}
        </div>

        <div className="ep-qc__head-actions">
          <button
            className="ep-qc__btn ep-qc__btn--ghost"
            onClick={() => {
              if (questions.length > 0 &&
                  !window.confirm("יש שאלות שלא נשמרו. לעזוב בכל זאת?")) return;
              setQuiz(null);
              setQuestions([]);
            }}
          >
             חזור
          </button>
          <button
            className="ep-qc__btn ep-qc__btn--primary"
            onClick={handleSubmit}
            disabled={saving || questions.length === 0}
          >
            {saving ? (
              <CircularProgress size={20} sx={{ color: "currentColor" }} />
            ) : (
              <>שמור חידון</>
            )}
          </button>
        </div>
      </header>

      {/* ── סטטיסטיקה ── */}
      <div className="ep-qc__stats">
        <div className="ep-qc__stat">
          <span className="ep-qc__stat-label">שאלות</span>
          <span className="ep-qc__stat-value">{questions.length}</span>
        </div>
        <div className="ep-qc__stat">
          <span className="ep-qc__stat-label">סה"כ נקודות</span>
          <span className="ep-qc__stat-value">{totalPoints}</span>
        </div>
        <div className="ep-qc__stat">
          <span className="ep-qc__stat-label">משך משחק משוער</span>
          <span className="ep-qc__stat-value">{Math.ceil(totalTime / 60)} <small>דק'</small></span>
        </div>
      </div>

      {/* ── תוכן ── */}
      <div className="ep-qc__body">

        {questions.length === 0 && !addingQuestion && (
          <div className="ep-qc__empty">
            <div className="ep-qc__empty-art" aria-hidden="true">
              {ANSWER_META.map((m, i) => (
                <span
                  key={i}
                  className="ep-qc__empty-shape"
                  style={{ color: m.color, animationDelay: `${i * 0.15}s` }}
                >
                  <EpShape kind={m.shape} size={32} />
                </span>
              ))}
            </div>
            <h2 className="ep-qc__empty-title">בואו נוסיף שאלה ראשונה</h2>
            <p className="ep-qc__empty-sub">
              שאלה אחת  מספיקה כדי להתחיל.
            </p>
            <button
              className="ep-qc__btn ep-qc__btn--primary ep-qc__btn--lg"
              onClick={() => setAddingQuestion(true)}
            >
              <span className="ep-qc__btn-plus">+</span>
              שאלה ראשונה
            </button>
          </div>
        )}

        {questions.length > 0 && (
          <ul className="ep-qc__qlist">
            {questions.map((q, i) => {
              const correctAnswers = q.answers.filter(a => a.isCorrect);
              return (
                <li className="ep-qc__qitem" key={i}>
                  <span className="ep-qc__qitem-num">{String(i + 1).padStart(2, "0")}</span>
                  <div className="ep-qc__qitem-body">
                    <p className="ep-qc__qitem-text">{q.text}</p>
                    <div className="ep-qc__qitem-meta">
                      <span className="ep-qc__qitem-chip">
                        {q.points} {q.points === 1 ? "נקודה" : "נקודות"}
                      </span>
                      <span className="ep-qc__qitem-chip">
                        {q.time} שניות
                      </span>
                      <span className="ep-qc__qitem-chip">
                        {q.answers.length} תשובות
                      </span>
                      {correctAnswers.length > 0 && (
                        <span className="ep-qc__qitem-chip ep-qc__qitem-chip--ok">
                          ✓ נכון: {correctAnswers.map(a => a.text).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="ep-qc__qitem-del"
                    onClick={() => handleRemoveQuestion(i)}
                    aria-label="מחק שאלה"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* ── + הוסף שאלה ── */}
        {questions.length > 0 && !addingQuestion && (
          <button
            className="ep-qc__add"
            onClick={() => setAddingQuestion(true)}
          >
            <span className="ep-qc__btn-plus">+</span>
            הוסף שאלה
          </button>
        )}

        {/* ── טופס הוספה ── */}
        {addingQuestion && (
          <QuestionForm
            index={questions.length}
            onAddQuestion={handleAddQuestion}
            onCancel={() => setAddingQuestion(false)}
          />
        )}
      </div>
    </div>
  );
}
