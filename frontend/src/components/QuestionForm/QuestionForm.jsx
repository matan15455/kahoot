import { useState } from "react";
import "./QuestionForm.css";

export default function QuestionForm({ onAddQuestion, onCancel }) {
  const [text, setText] = useState("");
  const [type, setType] = useState("multiple-choice");
  const [time, setTime] = useState(30);
  const [points, setPoints] = useState(1);
  const [answers, setAnswers] = useState([{ text: "", isCorrect: false }]);

  const handleAnswerChange = (index, key, value) => {
    let newAnswers = [...answers];

    if (key === "isCorrect") {
      // רק תשובה אחת יכולה להיות נכונה
      newAnswers = newAnswers.map((a, i) => ({
        ...a,
        isCorrect: i === index
      }));
    } else {
      newAnswers[index] = {
        ...newAnswers[index],
        text: value
      };
    }

    setAnswers(newAnswers);
  };


  const addAnswer = () => setAnswers([...answers, { text: "", isCorrect: false }]);
  const removeAnswer = (index) => setAnswers(answers.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!text.trim())
       return alert("אנא מלא טקסט שאלה");
    if (answers.some(a => !a.text.trim()))
       return alert("כל התשובות חייבות להכיל טקסט");
    if (!answers.some(a => a.isCorrect))
      return alert("חייב לבחור לפחות תשובה אחת נכונה");
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
        <label>זמן בשניות</label>
        <input
          className="q-input"
          type="number"
          value={time}
          onChange={e => {
            const val = +e.target.value;
            if (val >= 1) setTime(val); // לא מאפשרים שלילי
          }}
          placeholder="זמן בשניות"
        />

        <div className="q-setting">
          <label> נקודות</label>
          <input
            className="q-input"
            type="number"
            value={points}
            onChange={e => {
              const val = +e.target.value;
              if (val >= 1) setPoints(val); 
            }}
          />
        </div>
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
                type="radio"
                name="correctAnswer"
                checked={a.isCorrect}
                onChange={() => handleAnswerChange(i, "isCorrect", true)}
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
