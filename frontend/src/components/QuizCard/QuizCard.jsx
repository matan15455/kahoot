import "./QuizCard.css";
import { useNavigate } from "react-router-dom";

export default function QuizCard({ quiz }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/create-room?quizId=${quiz._id}`);
  };

  return (
    <div className="quiz-card-content" onClick={handleClick}>
      
      {/* אזור "תמונת הנושא" של החידון */}
      <div className="quiz-card-cover">
        <div className="quiz-icon">🧠</div>
      </div>

      <div className="quiz-card-body">
        <h3 className="quiz-title" title={quiz.title}>
          {quiz.title}
        </h3>
        <p className="quiz-description" title={quiz.description}>
          {quiz.description ? quiz.description : "ללא תיאור"}
        </p>
      </div>

      <div className="quiz-card-footer">
        <div className="questions-badge">
          📝 {quiz.questions?.length || 0} שאלות
        </div>
        
        <button className="play-quiz-btn">
          שחק <span className="play-icon">▶</span>
        </button>
      </div>
      
    </div>
  );
}