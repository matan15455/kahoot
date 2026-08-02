import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { EpShape, ANSWER_META } from "../_shared/EpBrand";
import CircularProgress from "@mui/material/CircularProgress";
import "./AICreateQuiz.css";

export default function AICreateQuiz() {

  const { token } = useAuth();

  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");  const [numQuestions, setNumQuestions] = useState(5);
  const [saving, setSaving] = useState(false);

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const generateQuiz = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;

    if (!topic.trim()) {
      setError("יש להזין נושא");
      return;
    }
    setError("");

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/ai/generate-quiz",
        { topic, instructions, numQuestions }
      );

      setQuiz({
        title: res.data.title || topic,
        description: res.data.description || "AI quiz"
      });

      const generated = res.data.questions.map(q => ({
        text: q.text,
        type: "multiple-choice",
        time: 30,
        points: 1000,
        answers: q.options.map((opt, i) => ({
          text: opt,
          isCorrect: i === q.correctIndex
        }))
      }));

      setQuestions(generated);

    } catch (err) {
      console.error(err);

      if (err.response?.data?.source === "google-api") {
        setError("בעיה בשירות API של גמיני ");
      } else {
        setError("בעיה ביצירת החידון. נסו שוב או שנו את הנושא.");
      }
    }

    setLoading(false);
  };


  const updateQuestionField = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = field === "text" ? value : Number(value);
    setQuestions(updated);
  };


  const updateAnswer = (qIndex, aIndex, value) => {
    const updated = [...questions];
    updated[qIndex].answers[aIndex].text = value;
    setQuestions(updated);
  };


  const updateCorrectAnswer = (qIndex, aIndex) => {
    const updated = [...questions];

    updated[qIndex].answers =
      updated[qIndex].answers.map((a, i) => ({
        ...a,
        isCorrect: i === aIndex
      }));

    setQuestions(updated);
  };

  const addAnswer = (qIndex) => {
    const updated = [...questions];
    if (updated[qIndex].answers.length >= 8) return;
    updated[qIndex].answers.push({ text: "", isCorrect: false });
    setQuestions(updated);
  };

  const removeAnswer = (qIndex, aIndex) => {
    const updated = [...questions];
    if (updated[qIndex].answers.length <= 2) return;

    const wasCorrect = updated[qIndex].answers[aIndex].isCorrect;
    updated[qIndex].answers = updated[qIndex].answers.filter((_, i) => i !== aIndex);

    // אם מחקנו את הנכונה - נסמן את הראשונה כנכונה
    if (wasCorrect && !updated[qIndex].answers.some(a => a.isCorrect)) {
      updated[qIndex].answers[0].isCorrect = true;
    }

    setQuestions(updated);
  };

  const removeQuestion = (qIndex) => {
    if (!window.confirm("למחוק את השאלה?")) return;
    setQuestions(questions.filter((_, i) => i !== qIndex));
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: "multiple-choice",
        time: 30,
        points: 1000,
        answers: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]
      }
    ]);
  };


  const handleSubmit = async () => {

    if (!quiz) return alert("חסר חידון");
    if (questions.length === 0) return alert("אין שאלות");

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
      alert("שגיאה בשמירה");
    }

    setSaving(false);
  };

  const difficultyLabels = {
    easy: "קל",
    medium: "בינוני",
    hard: "קשה"
  };

  /* ============ Step 1: Generate form ============ */
  if (!quiz) {
    return (
      <div className="ep-ai">
        {success && (
          <div className="ep-ai__toast" role="status">
            <span className="ep-ai__toast-icon">✓</span>
            החידון נשמר בהצלחה
          </div>
        )}

        <form className="ep-ai__form" onSubmit={generateQuiz} noValidate>

          <div className="ep-ai__form-head">
            <h1 className="ep-ai__title">
              יצירה עם AI<br />
            </h1>
            <p className="ep-ai__sub">
             בחר נושא והנחיות וה-AI ייצור בשבילך את השאלות. תוכל גם לערוך אחרי זה
            </p>
          </div>

          <div className="ep-ai__fields">
            {/* נושא */}
            <div className="ep-field">
              <label className="ep-field__label" htmlFor="ai-topic">
                נושא החידון
              </label>
              <textarea
                id="ai-topic"
                className="ep-field__input ep-ai__topic"
                placeholder="לדוגמה: מלחמות העולם, פיזיקה, ספרי בראשית…"
                value={topic}
                onChange={(e) => { setTopic(e.target.value); if (error) setError(""); }}
                rows={3}
                maxLength={500}
                autoFocus
              />
              <p className="ep-field__hint">
                ככל שהנושא יותר ספציפי אז השאלות יותר מדויקות.
              </p>
            </div>

            {/* הנחיות */}
            <div className="ep-field">
              <label className="ep-field__label">הנחיות לחידון (אופציונלי)</label>
              <textarea
                className="ep-field__input ep-ai__topic"
                placeholder="לדוגמה: שאלות לכיתה ז', ברמה קשה, עם דגש על תאריכים…"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                maxLength={300}
              />
            </div>

            {/* מספר שאלות */}
            <div className="ep-field">
              <label className="ep-field__label" htmlFor="ai-num">מספר שאלות</label>
              <div className="ep-ai__stepper">
                <button type="button" className="ep-ai__stepper-btn"
                  onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))} aria-label="הפחת">−</button>
                <input id="ai-num" className="ep-ai__stepper-input" type="number"
                  min={1} max={50} value={numQuestions}
                  onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= 50) setNumQuestions(v); }} />
                <button type="button" className="ep-ai__stepper-btn"
                  onClick={() => setNumQuestions(Math.min(50, numQuestions + 1))} aria-label="הגדל">+</button>
              </div>
            </div>

            {error && (
              <div className="ep-ai__error" role="alert">
                <span className="ep-ai__error-icon">!</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            className="ep-ai__submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="ep-ai__loader" />
                <span>ה-AI חושב…</span>
              </>
            ) : (
              <>
                <span>צור חידון</span>
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  /* ============ Step 2: Review & edit ============ */
  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);
  const totalTime = questions.reduce((s, q) => s + (q.time || 0), 0);

  return (
    <div className="ep-ai">

      <header className="ep-ai__head">
        <div className="ep-ai__head-text">
          <h1 className="ep-ai__rev-title">{quiz.title}</h1>
          {quiz.description && quiz.description !== "AI quiz" && (
            <p className="ep-ai__rev-desc">{quiz.description}</p>
          )}
        </div>
        <div className="ep-ai__head-actions">
          <button
            className="ep-ai__btn ep-ai__btn--ghost"
            onClick={() => {
              if (!window.confirm("לזרוק את הטיוטה ולהתחיל מחדש?")) return;
              setQuiz(null);
              setQuestions([]);
            }}
          >
           התחל מחדש
          </button>
          <button
            className="ep-ai__btn ep-ai__btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} sx={{ color: "currentColor" }} /> : "שמור חידון"}
          </button>
        </div>
      </header>

      {/* סטטיסטיקה */}
      <div className="ep-ai__stats">
        <div className="ep-ai__stat">
          <span className="ep-ai__stat-label">שאלות</span>
          <span className="ep-ai__stat-value">{questions.length}</span>
        </div>
        <div className="ep-ai__stat">
          <span className="ep-ai__stat-label">סה"כ נקודות</span>
          <span className="ep-ai__stat-value">{totalPoints}</span>
        </div>
        <div className="ep-ai__stat">
          <span className="ep-ai__stat-label">משך משוער</span>
          <span className="ep-ai__stat-value">{Math.ceil(totalTime / 60)} <small>דק'</small></span>
        </div>
      </div>

      {/* רשימת שאלות לעריכה */}
      <ul className="ep-ai__qlist">
        {questions.map((q, i) => (
          <li className="ep-ai__qcard" key={i}>

            <div className="ep-ai__qcard-head">
              <span className="ep-ai__qcard-num">שאלה {String(i + 1).padStart(2, "0")}</span>
              <div className="ep-ai__qcard-head-end">
                <span className="ep-ai__qcard-badge">
                  <span className="ep-ai__sparkle">✦</span> AI
                </span>
                <button
                  type="button"
                  className="ep-ai__qcard-del"
                  onClick={() => removeQuestion(i)}
                  aria-label="מחק שאלה"
                  title="מחק שאלה"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="ep-field">
              <label className="ep-field__label">טקסט השאלה</label>
              <textarea
                className="ep-field__input ep-ai__qcard-text"
                value={q.text}
                onChange={(e) => updateQuestionField(i, "text", e.target.value)}
                rows={2}
                maxLength={200}
              />
            </div>

            <div className="ep-ai__row-2">
              <div className="ep-field">
                <label className="ep-field__label">זמן (שניות)</label>
                <input
                  className="ep-field__input"
                  type="number"
                  min={5}
                  max={300}
                  value={q.time}
                  onChange={(e) => updateQuestionField(i, "time", e.target.value)}
                />
              </div>
              <div className="ep-field">
                <label className="ep-field__label">נקודות</label>
                <select                                         // ← זה במקומו
                  className="ep-field__input"
                  value={q.points}
                  onChange={(e) => updateQuestionField(i, "points", e.target.value)}
                >
                  {[1000,2000,3000,4000,5000,6000,7000,8000,9000,10000].map(v => (
                    <option key={v} value={v}>{v.toLocaleString()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ep-ai__answers-head">
              <span className="ep-field__label">תשובות · סמנו את הנכונה</span>
              <span className="ep-ai__answers-count">
                {q.answers.length} {q.answers.length === 1 ? "תשובה" : "תשובות"}
              </span>
            </div>

            <ul className="ep-ai__answers">
              {q.answers.map((a, aIndex) => {
                const meta = ANSWER_META[aIndex % ANSWER_META.length];
                return (
                  <li
                    key={aIndex}
                    className={"ep-ai__answer" + (a.isCorrect ? " is-correct" : "")}
                  >
                    <span
                      className="ep-ai__answer-letter"
                      style={{ background: meta.color, color: meta.textOn }}
                    >
                      <span>{meta.letter}</span>
                      <span className="ep-ai__answer-glyph" aria-hidden="true">
                        <EpShape kind={meta.shape} size={12} />
                      </span>
                    </span>
                    <input
                      className="ep-field__input ep-ai__answer-input"
                      type="text"
                      value={a.text}
                      onChange={(e) => updateAnswer(i, aIndex, e.target.value)}
                      placeholder={`תשובה ${aIndex + 1}`}
                    />
                    <label className="ep-ai__answer-mark" title="התשובה הנכונה">
                      <input
                        type="radio"
                        name={`correct-${i}`}
                        checked={a.isCorrect}
                        onChange={() => updateCorrectAnswer(i, aIndex)}
                      />
                      <span className="ep-ai__answer-mark-circle">
                        {a.isCorrect ? "✓" : ""}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="ep-ai__answer-del"
                      onClick={() => removeAnswer(i, aIndex)}
                      disabled={q.answers.length <= 2}
                      aria-label="מחק תשובה"
                      title={q.answers.length <= 2 ? "חייבות לפחות 2 תשובות" : "מחק תשובה"}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>

            {q.answers.length < 8 && (
              <button
                type="button"
                className="ep-ai__add-answer"
                onClick={() => addAnswer(i)}
              >
                <span className="ep-ai__add-plus">+</span>
                הוסף תשובה
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="ep-ai__add-question"
        onClick={addQuestion}
      >
        <span className="ep-ai__add-plus">+</span>
        הוסף שאלה
      </button>
    </div>
  );
}
