import "./QuizCard.css";
import { useNavigate } from "react-router-dom";

export default function QuizCard({ quiz }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/create-room?quizId=${quiz._id}`);
  };

  return (
    <div className="quiz-card" onClick={handleClick}>
      <h3 className="quiz-title">{quiz.title}</h3>
      <p className="quiz-description">
        {quiz.description ? quiz.description : "ללא תיאור"}
      </p>
      <p className="quiz-info">
        מספר שאלות: {quiz.questions.length}
      </p>
    </div>
  );
}
