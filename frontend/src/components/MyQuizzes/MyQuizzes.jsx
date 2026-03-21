import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import QuizCard from "../QuizCard/QuizCard";
import "./MyQuizzes.css";
import CircularProgress from '@mui/material/CircularProgress';
import Box from "@mui/material/Box";

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/quizzes/my",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setQuizzes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }; 

    fetchQuizzes();

  }, [token]);

  /* ==========================
     Loading State
  ========================== */
  if (loading) {
    return (
      <div className="myquizzes-wrapper">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh"
          }}
        >
          {/* התאמתי את הצבע של MUI לטון הניאון שלנו */}
          <CircularProgress sx={{ color: '#00e5ff' }} size={80} thickness={4} />
        </Box>
      </div>
    );
  }

  /* ==========================
     Main UI
  ========================== */
  return (
    <div className="myquizzes-wrapper">
      <div className="myquizzes-container">
        
        <div className="myquizzes-header">
          <h1 className="title-glow">החידונים שלי 📚</h1>
        </div>

        {quizzes.length === 0 ? (
          <div className="glass-panel empty-state">
            <div className="empty-icon">📂</div>
            <h2>עדיין לא יצרת חידונים</h2>
            <p>זה הזמן להתחיל ליצור חידונים מטורפים ולשחק עם חברים!</p>
          </div>
        ) : (
          <div className="quizzes-grid">
            {quizzes.map((quiz, index) => (
              <div 
                className="quiz-wrapper" 
                key={quiz._id}
                style={{ animationDelay: `${index * 0.1}s` }} /* אנימציית הופעה מדורגת */
              >
                <div className="glass-card">
                  {/* אנחנו מניחים שה-QuizCard שלך יושב פה בפנים */}
                  <QuizCard quiz={quiz} />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}