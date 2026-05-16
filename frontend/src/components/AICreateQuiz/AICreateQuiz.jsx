import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./AICreateQuiz.css";

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

  // אינדקס השאלה שנמצאת במצב עריכה (null = אין)
  const [editingIndex, setEditingIndex] = useState(null);

  /* ── Generate ── */
  const generateQuiz = async () => {
    if (loading) 
      return;
    if (!topic.trim()) 
      return alert("יש להזין נושא");

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/ai/generate-quiz",
        { topic, difficulty, numQuestions }
      );

      setQuiz({
        title: res.data.title || topic,
        description: res.data.description || "AI quiz",
      });

      const generated = res.data.questions.map((q) => ({
        text: q.text,
        type: "multiple-choice",
        time: 30,
        points: 1,
        answers: q.options.map((opt, i) => ({
          text: opt,
          isCorrect: i === q.correctIndex,
        })),
      }));

      setQuestions(generated);
      setEditingIndex(null);
    } catch (err) {
      console.error(err);
      alert("בעיה ביצירת החידון");
    }

    setLoading(false);
  };

  /* ── Field updates (non-edit mode) ── */
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
      isCorrect: i === aIndex,
    }));
    setQuestions(updated);
  };

  /* ── Delete question ── */
  const deleteQuestion = (index) => {
    if (questions.length <= 1) 
      return alert("חייבת להיות לפחות שאלה אחת");
    setQuestions(questions.filter((_, i) => i !== index));
    if (editingIndex === index) 
      setEditingIndex(null);
    else if (editingIndex > index) 
      setEditingIndex(editingIndex - 1);
  };

  /* ── Add blank question ── */
  const addQuestion = () => {
    const blank = {
      text: "",
      type: "multiple-choice",
      time: 30,
      points: 1,
      answers: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    };
    const newQuestions = [...questions, blank];
    setQuestions(newQuestions);
    setEditingIndex(newQuestions.length - 1); // פותח עריכה על השאלה החדשה
  };

  /* ── Edit-mode helpers ── */
  const startEditing = (index) =>
    setEditingIndex(editingIndex === index ? null : index);

  const addAnswerToQuestion = (qIndex) => {
    const updated = [...questions];
    if (updated[qIndex].answers.length >= 8) return;
    updated[qIndex].answers.push({ text: "", isCorrect: false });
    setQuestions(updated);
  };

  const removeAnswerFromQuestion = (qIndex, aIndex) => {
    const updated = [...questions];
    if (updated[qIndex].answers.length <= 2) return;
    updated[qIndex].answers = updated[qIndex].answers.filter(
      (_, i) => i !== aIndex
    );
    // וודא שיש תשובה נכונה
    const hasCorrect = updated[qIndex].answers.some((a) => a.isCorrect);
    if (!hasCorrect) updated[qIndex].answers[0].isCorrect = true;
    setQuestions(updated);
  };

  /* ── Save ── */
  const handleSubmit = async () => {
    if (!quiz) return alert("חסר חידון");
    if (questions.length === 0) return alert("אין שאלות");

    const invalid = questions.find(
      (q) =>
        !q.text.trim() ||
        q.answers.some((a) => !a.text.trim()) ||
        !q.answers.some((a) => a.isCorrect)
    );
    if (invalid) return alert("יש שאלות עם שדות ריקים או ללא תשובה נכונה");

    try {
      setSaving(true);

      await axios.post(
        "http://localhost:5000/quizzes",
        { ...quiz, questions },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setQuiz(null);
      setQuestions([]);
      setEditingIndex(null);
    } catch (err) {
      console.error(err);
      alert("שגיאה בשמירה");
    }

    setSaving(false);
  };

  /* ================================================================
     RENDER
  ================================================================ */
  return (
    <div className="ep-ai">
      <div className="ep-ai__container">

        {success && (
          <div className="ep-ai__alert">
            <span className="ep-ai__alert-icon">✓</span>
            החידון נשמר בהצלחה במערכת!
          </div>
        )}

        {/* ══════════ שלב 1: טופס יצירה ══════════ */}
        {!quiz ? (
          <div className="ep-ai__card ep-ai__setup">
            <div className="ep-ai__header">
              <span className="ep-ai__kicker">מחולל ה-AI</span>
              <h2 className="ep-ai__title">יצירת חידון חכם</h2>
              <p className="ep-ai__subtitle">
                הזינו נושא והבינה המלאכותית שלנו תעשה את השאר.
              </p>
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

          /* ══════════ שלב 2: עורך שאלות ══════════ */
          <div className="ep-ai__editor">
            <div className="ep-ai__editor-head">
              <span className="ep-ai__kicker">עריכה מקדימה</span>
              <h2 className="ep-ai__title">{quiz.title}</h2>
              <p className="ep-ai__editor-count">
                {questions.length} שאלות
              </p>
            </div>

            <div className="ep-ai__questions">
              {questions.map((q, i) => {
                const isEditing = editingIndex === i;

                return (
                  <div
                    className={`ep-ai__q-card ${isEditing ? "is-editing" : ""}`}
                    key={i}
                  >
                    {/* ── ראש כרטיס ── */}
                    <div className="ep-ai__q-header">
                      <span className="ep-ai__q-num">שאלה {i + 1}</span>

                      <div className="ep-ai__q-actions">
                        {/* זמן + נקודות — תמיד נגישים */}
                        <div className="ep-ai__meta-item">
                          <label>⏱</label>
                          <input
                            type="number"
                            min="5"
                            max="120"
                            className="ep-input ep-input--sm"
                            value={q.time}
                            onChange={(e) =>
                              updateQuestionField(i, "time", e.target.value)
                            }
                          />
                        </div>
                        <div className="ep-ai__meta-item">
                          <label>⭐</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            className="ep-input ep-input--sm"
                            value={q.points}
                            onChange={(e) =>
                              updateQuestionField(i, "points", e.target.value)
                            }
                          />
                        </div>

                        {/* עריכה */}
                        <button
                          className={`ep-ai__icon-btn ep-ai__icon-btn--edit ${isEditing ? "is-active" : ""}`}
                          onClick={() => startEditing(i)}
                          title={isEditing ? "סגור עריכה" : "ערוך שאלה"}
                        >
                          {isEditing ? "✕" : "✏️"}
                        </button>

                        {/* מחיקה */}
                        <button
                          className="ep-ai__icon-btn ep-ai__icon-btn--del"
                          onClick={() => deleteQuestion(i)}
                          title="מחק שאלה"
                          disabled={questions.length <= 1}
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* ── טקסט שאלה ── */}
                    <textarea
                      className="ep-input ep-textarea"
                      value={q.text}
                      onChange={(e) =>
                        updateQuestionField(i, "text", e.target.value)
                      }
                      placeholder="כתבו את השאלה כאן..."
                    />

                    {/* ── תשובות ── */}
                    <div className="ep-ai__answers">
                      {q.answers.map((a, aIndex) => {
                        const color =
                          ANSWER_COLORS[aIndex % ANSWER_COLORS.length];
                        return (
                          <div
                            key={aIndex}
                            className={`ep-ai__ans-row ${a.isCorrect ? "is-correct" : ""}`}
                            style={{ "--ans-color": color }}
                          >
                            {/* רדיו תשובה נכונה */}
                            <label className="ep-ai__ans-radio">
                              <input
                                type="radio"
                                name={`correct-${i}`}
                                checked={a.isCorrect}
                                onChange={() => updateCorrectAnswer(i, aIndex)}
                              />
                              <span className="ep-ai__ans-custom-radio" />
                            </label>

                            {/* טקסט תשובה */}
                            <input
                              className="ep-input ep-ai__ans-input"
                              value={a.text}
                              onChange={(e) =>
                                updateAnswer(i, aIndex, e.target.value)
                              }
                              placeholder={`תשובה ${aIndex + 1}`}
                            />

                            {/* מחיקת תשובה — רק במצב עריכה */}
                            {isEditing && (
                              <button
                                className="ep-ai__ans-del"
                                onClick={() =>
                                  removeAnswerFromQuestion(i, aIndex)
                                }
                                disabled={q.answers.length <= 2}
                                title="מחק תשובה"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* הוסף תשובה — רק במצב עריכה */}
                      {isEditing && q.answers.length < 8 && (
                        <button
                          className="ep-ai__add-ans"
                          onClick={() => addAnswerToQuestion(i)}
                        >
                          <span>+</span> הוסף תשובה
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── הוסף שאלה ── */}
            <button className="ep-ai__add-q" onClick={addQuestion}>
              <span>+</span>
              הוסף שאלה ידנית
            </button>

            {/* ── שמור ── */}
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