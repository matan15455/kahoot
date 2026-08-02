import { useState } from "react";
import { EpShape } from "../_shared/EpBrand";
import "./QuizForm.css";

export default function QuizForm({ onAddQuiz }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim()) {
      setError("נא להזין שם לחידון");
      return;
    }
    onAddQuiz({ title, description });
  };

  return (
    <form className="ep-qf" onSubmit={handleSubmit} noValidate>

      <div className="ep-qf__head">
        <p className="ep-qf__kicker">
          <span className="ep-qf__kicker-mark" style={{ color: "var(--ep-ans-2)" }}>
            <EpShape kind="hex" size={14} />
          </span>
          חידון חדש · שלב 1 מתוך 2
        </p>
        <h1 className="ep-qf__title">יצירת שאלה ידנית</h1>

      </div>

      <div className="ep-qf__fields">
        <div className="ep-field">
          <label className="ep-field__label" htmlFor="quiz-title">
            שם החידון
          </label>
          <input
            id="quiz-title"
            className="ep-field__input"
            type="text"
            placeholder="לדוגמה: היסטוריה של המאה ה-20"
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (error) setError(""); }}
            autoFocus
            maxLength={80}
          />
        </div>

        <div className="ep-field">
          <label className="ep-field__label" htmlFor="quiz-desc">
            תיאור (אופציונלי)
          </label>
          <textarea
            id="quiz-desc"
            className="ep-field__input ep-qf__textarea"
            placeholder="מה התלמידים ילמדו בחידון? למי הוא מיועד?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={300}
          />
          <p className="ep-field__hint">{description.length}/300</p>
        </div>

        {error && (
          <div className="ep-qf__error" role="alert">
            <span className="ep-qf__error-icon">!</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      <button className="ep-qf__submit" type="submit">
        <span>המשך ליצירת שאלות</span>
      </button>
    </form>
  );
}
