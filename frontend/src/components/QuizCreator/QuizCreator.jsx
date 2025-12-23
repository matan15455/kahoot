import { useState,useContext } from "react";
import QuizForm from "../QuizForm/QuizForm";
import QuestionForm from "../QuestionForm/QuestionForm";
import axios from "axios";
import "./QuizCreator.css";

export default function QuizCreator() {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [addingQuestion, setAddingQuestion] = useState(false);

  const handleAddQuiz = (quizData) => setQuiz(quizData);
  const handleAddQuestion = (q) => {
    setQuestions([...questions, q]);
    setAddingQuestion(false);
  };

  const handleSubmit = async () => {
    if (!quiz)
       return alert("חסר חידון");
    if (questions.length === 0) 
      return alert("הוסף לפחות שאלה אחת");

    try {
      const token = localStorage.getItem("token");

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

      alert("חידון נוסף בהצלחה!");
      setQuiz(null);
      setQuestions([]);
    } catch (err) {
      console.error(err);
      alert("שגיאה ביצירת החידון");
    }
  };

  return (
    <div className="quiz-creator-container">
      {!quiz ? (
        <QuizForm onAddQuiz={handleAddQuiz}/>
      ) : (
        <>
          <h2 className="quiz-title">{quiz.title} - שאלות</h2>

          <button
            className="add-question-btn"
            onClick={() => setAddingQuestion(true)}
          >
            + הוסף שאלה
          </button>

          {addingQuestion && (
            <QuestionForm
              onAddQuestion={handleAddQuestion}
              onCancel={() => setAddingQuestion(false)}
            />
          )}

          <ul className="questions-list">
            {questions.map((q, i) => (
              <li className="question-item" key={i}>
                <span className="q-text">{q.text}</span>
                <span className="q-meta">
                  {q.points} נקודות • {q.time}s
                </span>
              </li>
            ))}
          </ul>

          <button className="save-quiz-btn" onClick={handleSubmit}>
            שמור חידון
          </button>
        </>
      )}
    </div>
  );
}
