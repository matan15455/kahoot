import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import QuizForm from "../QuizForm/QuizForm";
import QuestionForm from "../QuestionForm/QuestionForm";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import "./QuizCreator.css";
import Alert from '@mui/material/Alert';


export default function QuizCreator() {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [saving,setSaving] = useState(false);
  const [success,setSuccess] = useState(false);

  const { token } = useAuth();

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
      setTimeout(()=>setSuccess(false),1000);

      setQuiz(null);
      setQuestions([]);
    } catch (err) {
      console.error(err);
      alert("שגיאה ביצירת החידון");
    }

    setSaving(false);
  };

  return (
    <div className="quiz-creator-container">

      {success && (
        <Alert
          variant="outlined"
          severity="success"
          sx={{
            fontFamily: "Heebo",
            fontSize: "16px",
            color: "#0f5132"
          }}
        >
          החידון נשמר בהצלחה
        </Alert>
      )}

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

          <button
            className="save-quiz-btn"
            onClick={handleSubmit}
            disabled={saving}
          >

            {saving ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "שמור חידון"
            )}

          </button>

        </>
      )}
    </div>
  );
}
