import { useState } from "react";
import "./QuestionForm.css";

export default function QuestionForm({ onAddQuestion, onCancel }) {
  const [text, setText] = useState("");
  const [type, setType] = useState("multiple-choice");
  const [time, setTime] = useState(30);
  const [points, setPoints] = useState(1);
  const [answers, setAnswers] = useState([{ text: "", isCorrect: false }]);

  const handleAnswerChange = (index, key, value) => {
    // יוצרים עותק חדש של מערך התשובות
    const newAnswers = [...answers];

    // יוצרים עותק של התשובה הספציפית שנבחרה
    const answerToUpdate = { ...answers[index] };

    // בודקים איזה שדה רוצים לעדכן
    if (key === "text") {
      answerToUpdate.text = value;
    } else if (key === "isCorrect") {
      answerToUpdate.isCorrect = value;
    }

    // מחזירים את התשובה המעודכנת למערך
    newAnswers[index] = answerToUpdate;

    // מעדכנים את ה-state
    setAnswers(newAnswers);
  };


  const addAnswer = () => setAnswers([...answers, { text: "", isCorrect: false }]);
  const removeAnswer = (index) => setAnswers(answers.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!text.trim())
       return alert("אנא מלא טקסט שאלה");
    if (answers.some(a => !a.text.trim()))
       return alert("כל התשובות חייבות להכיל טקסט");
    onAddQuestion({ text, type, time, points, answers });
  };

  return (
    <div className="question-card">
      <h3>הוספת שאלה</h3>

      <input
        className="q-input"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="טקסט שאלה"
      />

      <div className="question-settings">
        <input
          className="q-input"
          type="number"
          value={time}
          onChange={e => setTime(+e.target.value)}
          placeholder="זמן בשניות"
        />

        <input
          className="q-input"
          type="number"
          value={points}
          onChange={e => setPoints(+e.target.value)}
          placeholder="נקודות"
        />
      </div>

      <div className="answers-list">
        {answers.map((a, i) => (
          <div key={i} className="answer-item">
            <input
              className="answer-input"
              value={a.text}
              onChange={e => handleAnswerChange(i, "text", e.target.value)}
              placeholder={`תשובה ${i + 1}`}
            />

            <label className="answer-check">
              נכון?
              <input
                type="checkbox"
                checked={a.isCorrect}
                onChange={e =>
                  handleAnswerChange(i, "isCorrect", e.target.checked)
                }
              />
            </label>

            <button className="delete-btn" onClick={() => removeAnswer(i)}>
              ❌
            </button>
          </div>
        ))}

        <button className="add-answer-btn" onClick={addAnswer}>
          + תשובה
        </button>
      </div>

      <div className="question-actions">
        <button className="submit-btn" onClick={handleSubmit}>
          הוסף שאלה
        </button>
        <button className="cancel-btn" onClick={onCancel}>
          בטל
        </button>
      </div>
    </div>
  );
}
