import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./AICreateQuiz.css";

// הסרתי את הרכיבים של MUI כי עיצבנו להם חלופות תואמות מותג EduPlay
// import CircularProgress from "@mui/material/CircularProgress";
// import Alert from '@mui/material/Alert';

// מטא-דאטה לצבעי התשובות (כמו במסך השחקן)
const ANSWER_COLORS = [
  "var(--ep-ans-1)",
  "var(--ep-ans-2)",
  "var(--ep-ans-3)",
  "var(--ep-ans-4)",
];

export default function AICreateQuiz() {
  const { token } = useAuth();

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [saving, setSaving] = useState(false);

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const generateQuiz = async () => {
    if (loading) return;
    if (!topic.trim()) return alert("יש להזין נושא");

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/ai/generate-quiz",
        { topic, difficulty, numQuestions }
      );

      setQuiz({
        title: res.data.title || topic,
        description: res.data.description || "AI quiz"
      });

      const generated = res.data.questions.map(q => ({
        text: q.text,
        type: "multiple-choice",
        time: 30,
        points: 1,
        answers: q.options.map((opt, i) => ({
          text: opt,
          isCorrect: i === q.correctIndex
        }))
      }));

      setQuestions(generated);
    } catch (err) {
      console.error(err);
      alert("בעיה ביצירת החידון");
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

    updated[qIndex].answers = updated[qIndex].answers.map((a, i) => ({
      ...a,
      isCorrect: i === aIndex
    }));

    setQuestions(updated);
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
      setTimeout(() => setSuccess(false), 2000);

      setQuiz(null);
      setQuestions([]);
    } catch (err) {
      console.error(err);
      alert("שגיאה בשמירה");
    }

    setSaving(false);
  };

  return (
    <div className="ep-ai">
      <div className="ep-ai__container">
        
        {success && (
          <div className="ep-ai__alert">
            <span className="ep-ai__alert-icon">✓</span>
            החידון נשמר בהצלחה במערכת!
          </div>
        )}

        {!quiz ? (
          /* ============ Form State ============ */
          <div className="ep-ai__card ep-ai__setup">
            <div className="ep-ai__header">
              <span className="ep-ai__kicker">מחולל ה-AI</span>
              <h2 className="ep-ai__title">יצירת חידון חכם</h2>
              <p className="ep-ai__subtitle">הזינו נושא והבינה המלאכותית שלנו תעשה את השאר.</p>
            </div>

            <div className="ep-ai__form">
              <div className="ep-ai__field">
                <label>נושא החידון</label>
                <input
                  className="ep-input"
                  placeholder="לדוגמה: היסטוריה של האינטרנט..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="ep-ai__row">
                <div className="ep-ai__field">
                  <label>רמת קושי</label>
                  <select
                    className="ep-input"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    disabled={loading}
                  >
                    <option value="easy">קל</option>
                    <option value="medium">בינוני</option>
                    <option value="hard">קשה</option>
                  </select>
                </div>

                <div className="ep-ai__field">
                  <label>מספר שאלות</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="ep-input"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                className={`ep-btn ep-btn--primary ${loading ? "is-loading" : ""}`}
                onClick={generateQuiz}
                disabled={loading}
              >
                {loading ? (
                  <div className="ep-spinner ep-spinner--white" />
                ) : (
                  <>✨ צור חידון</>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ============ Editor State ============ */
          <div className="ep-ai__editor">
            <div className="ep-ai__editor-head">
              <span className="ep-ai__kicker">עריכה מקדימה</span>
              <h2 className="ep-ai__title">{quiz.title}</h2>
            </div>

            <div className="ep-ai__questions">
              {questions.map((q, i) => (
                <div className="ep-ai__q-card" key={i}>
                  <div className="ep-ai__q-header">
                    <span className="ep-ai__q-num">שאלה {i + 1}</span>
                    
                    <div className="ep-ai__q-meta">
                      <div className="ep-ai__meta-item">
                        <label>⏱ שניות</label>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          className="ep-input ep-input--sm"
                          value={q.time}
                          onChange={(e) => updateQuestionField(i, "time", e.target.value)}
                        />
                      </div>
                      <div className="ep-ai__meta-item">
                        <label>⭐ נקודות</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          className="ep-input ep-input--sm"
                          value={q.points}
                          onChange={(e) => updateQuestionField(i, "points", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <textarea
                    className="ep-input ep-textarea"
                    value={q.text}
                    onChange={(e) => updateQuestionField(i, "text", e.target.value)}
                    placeholder="כתבו את השאלה כאן..."
                  />

                  <div className="ep-ai__answers">
                    {q.answers.map((a, aIndex) => {
                      const color = ANSWER_COLORS[aIndex % ANSWER_COLORS.length];
                      return (
                        <div 
                          key={aIndex} 
                          className={`ep-ai__ans-row ${a.isCorrect ? "is-correct" : ""}`}
                          style={{ "--ans-color": color }}
                        >
                          <label className="ep-ai__ans-radio">
                            <input
                              type="radio"
                              name={`correct-${i}`}
                              checked={a.isCorrect}
                              onChange={() => updateCorrectAnswer(i, aIndex)}
                            />
                            <span className="ep-ai__ans-custom-radio" />
                          </label>
                          <input
                            className="ep-input ep-ai__ans-input"
                            value={a.text}
                            onChange={(e) => updateAnswer(i, aIndex, e.target.value)}
                            placeholder={`תשובה ${aIndex + 1}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="ep-ai__actions">
              <button
                className={`ep-btn ep-btn--primary ep-btn--lg ${saving ? "is-loading" : ""}`}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <div className="ep-spinner ep-spinner--white" />
                ) : (
                  "שמור חידון במערכת"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}