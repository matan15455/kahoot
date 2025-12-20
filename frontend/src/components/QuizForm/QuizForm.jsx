import { useState } from "react";
import "./QuizForm.css";

export default function QuizForm({ onAddQuiz }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim())
       return alert("אנא מלא שם לחידון");
    onAddQuiz({ title, description });
  };

  return (
    <div className="quiz-form-card">
      <h2>יצירת חידון חדש</h2>

      <input 
        className="quiz-input"
        value={title} 
        onChange={e => setTitle(e.target.value)} 
        placeholder="שם החידון" 
      />

      <textarea 
        className="quiz-textarea"
        value={description} 
        onChange={e => setDescription(e.target.value)} 
        placeholder="תיאור החידון (אופציונלי)" 
      />

      <button className="quiz-submit-btn" onClick={handleSubmit}>
        המשך ליצירת שאלות
      </button>
    </div>
  );
}
