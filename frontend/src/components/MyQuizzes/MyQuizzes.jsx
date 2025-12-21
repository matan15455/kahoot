import { useState, useEffect,useContext } from "react";
import axios from "axios";
import QuizCard from "../QuizCard/QuizCard";
import "./MyQuizzes.css";

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      
      const token = localStorage.getItem("token");

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

  }, []);

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
