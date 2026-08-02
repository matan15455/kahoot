import { useState } from "react";
import { EpShape, ANSWER_META } from "../_shared/EpBrand";
import "./QuestionForm.css";

export default function QuestionForm({ onAddQuestion, onCancel, index = 0 }) {
  const [text, setText] = useState("");
  const [type] = useState("multiple-choice");
  const [time, setTime] = useState(30);
  const [points, setPoints] = useState(1000);
  const [answers, setAnswers] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [error, setError] = useState("");

  const handleAnswerChange = (i, key, value) => {
    let newAnswers = [...answers];

    if (key === "isCorrect") {
      newAnswers = newAnswers.map((a, j) =>
        j === i ? { ...a, isCorrect: !a.isCorrect } : a
      );
    } else {
      newAnswers[i] = {
        ...newAnswers[i],
        text: value
      };
    }

    setAnswers(newAnswers);
    if (error) setError("");
  };

  const addAnswer = () => {
    if (answers.length >= 8) return;
    setAnswers([...answers, { text: "", isCorrect: false }]);
  };

  const removeAnswer = (i) => {
    if (answers.length <= 2) return; // לפחות 2 תשובות
    setAnswers(answers.filter((_, j) => j !== i));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!text.trim()) {
      setError("נא להזין טקסט שאלה");
      return;
    }
    if (answers.some(a => !a.text.trim())) {
      setError("כל התשובות חייבות להכיל טקסט");
      return;
    }
    if (!answers.some(a => a.isCorrect)) {
      setError("יש לבחור לפחות תשובה נכונה אחת");
      return;
    }
    onAddQuestion({ text, time, points, answers });
  };

  return (
    <form className="ep-qfq" onSubmit={handleSubmit} noValidate>

      <div className="ep-qfq__head">
        <div>
          <p className="ep-qfq__kicker">שאלה {String(index + 1).padStart(2, "0")}</p>
          <h3 className="ep-qfq__title">פרטי השאלה</h3>
        </div>
        <button
          type="button"
          className="ep-qfq__close"
          onClick={onCancel}
          aria-label="בטל"
        >
          ✕
        </button>
      </div>

      {/* טקסט השאלה */}
      <div className="ep-field">
        <label className="ep-field__label" htmlFor="qfq-text">טקסט השאלה</label>
        <textarea
          id="qfq-text"
          className="ep-field__input ep-qfq__text"
          placeholder="מה השאלה?"
          value={text}
          onChange={(e) => { setText(e.target.value); if (error) setError(""); }}
          rows={2}
          autoFocus
          maxLength={200}
        />
      </div>

      {/* זמן + נקודות */}
      <div className="ep-qfq__row-2">
        <div className="ep-field">
          <label className="ep-field__label" htmlFor="qfq-time">זמן (שניות)</label>
          <input
            id="qfq-time"
            className="ep-field__input"
            type="number"
            min={5}
            max={300}
            value={time}
            onChange={(e) => {
              const val = +e.target.value;
              if (val >= 1) setTime(val);
            }}
          />
        </div>
          <div className="ep-field">
            <label className="ep-field__label" htmlFor="qfq-pts">נקודות</label>
            <select
              id="qfq-pts"
              className="ep-field__input"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            >
              {[1000,2000,3000,4000,5000,6000,7000,8000,9000,10000].map(v => (
                <option key={v} value={v}>{v.toLocaleString()}</option>
              ))}
            </select>
        </div>
      </div>

      {/* תשובות */}
      <div className="ep-qfq__answers-head">
        <span className="ep-field__label">תשובות · סמנו את הנכונות (אפשר יותר מאחת)</span>
        <span className="ep-qfq__answers-count">
          {answers.length} {answers.length === 1 ? "תשובה" : "תשובות"}
        </span>
      </div>

      <ul className="ep-qfq__answers">
        {answers.map((a, i) => {
          const meta = ANSWER_META[i % ANSWER_META.length];
          return (
            <li
              key={i}
              className={"ep-qfq__answer" + (a.isCorrect ? " is-correct" : "")}
            >
              <span
                className="ep-qfq__answer-letter"
                style={{ background: meta.color, color: meta.textOn }}
              >
                <span>{meta.letter}</span>
                <span className="ep-qfq__answer-glyph" aria-hidden="true">
                  <EpShape kind={meta.shape} size={14} />
                </span>
              </span>

              <input
                className="ep-field__input ep-qfq__answer-input"
                type="text"
                placeholder={`תשובה ${i + 1}`}
                value={a.text}
                onChange={(e) => handleAnswerChange(i, "text", e.target.value)}
                maxLength={100}
              />

              <label className="ep-qfq__answer-mark" title="סמן/בטל כתשובה נכונה">
                <input
                  type="checkbox"
                  checked={a.isCorrect}
                  onChange={() => handleAnswerChange(i, "isCorrect", null)}
                />
                <span className="ep-qfq__answer-mark-circle">
                  {a.isCorrect ? "✓" : ""}
                </span>
              </label>

              <button
                type="button"
                className="ep-qfq__answer-del"
                onClick={() => removeAnswer(i)}
                disabled={answers.length <= 2}
                aria-label="מחק תשובה"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      {answers.length < 8 && (
        <button
          type="button"
          className="ep-qfq__add"
          onClick={addAnswer}
        >
          <span className="ep-qfq__add-plus">+</span>
          הוסף תשובה
        </button>
      )}

      {error && (
        <div className="ep-qfq__error" role="alert">
          <span className="ep-qfq__error-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      {/* כפתורים */}
      <div className="ep-qfq__actions">
        <button type="button" className="ep-qfq__btn ep-qfq__btn--ghost" onClick={onCancel}>
          בטל
        </button>
        <button type="submit" className="ep-qfq__btn ep-qfq__btn--primary">
          שמור שאלה
        </button>
      </div>
    </form>
  );
}
