import { useNavigate } from "react-router-dom";
import "./QuizCreationMode.css";

export default function QuizCreationMode() {
  const navigate = useNavigate();

  return (
    <div className="quiz-mode-page">
      <div className="quiz-mode-overlay"></div>

      <div className="quiz-mode-container">
        <div className="quiz-mode-header">
          <h1>יצירת חידון</h1>
          <p>בחר כיצד תרצה ליצור את החידון שלך</p>
        </div>

        <div className="quiz-mode-cards">

          {/* Manual */}
          <div
            className="quiz-mode-card manual"
            onClick={() => navigate("/create-manual")}
          >

            <h2>יצירה ידנית</h2>

            <p>
              צור חידון ידנית ובחר את התשובות והשאלות בעצמך
            </p>

            <button className="quiz-mode-btn manual-btn">
              התחל יצירה ידנית
            </button>
          </div>

          {/* AI */}
          <div
            className="quiz-mode-card ai"
            onClick={() => navigate("/create-ai")}
          >

            <h2>יצירה עם AI</h2>

            <p>
              בחר נושא ורמת קושי וה-AI ייצור עבורך חידון
              שתוכל לערוך לפני השמירה.
            </p>

            <button className="quiz-mode-btn ai-btn">
              צור חידון עם AI
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}