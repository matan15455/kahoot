import { useState, useEffect,useContext } from "react";
import axios from "axios";
import QuizCard from "../QuizCard/QuizCard";
import "./MyQuizzes.css";
import { UserContext } from "../../App";

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userId } = useContext(UserContext);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/quizzes/my/${userId}`);
        setQuizzes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }; 

    fetchQuizzes();

  }, [userId]);

  if (loading)
     return <p>טוען חידונים...</p>;

  return (
    <div className="myquizzes-page">
      <div className="myquizzes-header">
        <h1> החידונים שלי</h1>
        <span className="header-underline"></span>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <p>עדיין לא יצרת חידונים</p>
          <div className="empty-illustration"></div>
        </div>
      ) : (
        <div className="quizzes-grid">
          {quizzes.map((quiz) => (
            <div className="quiz-wrapper" key={quiz._id}>
              <QuizCard quiz={quiz} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
