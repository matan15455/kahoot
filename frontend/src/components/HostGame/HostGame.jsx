import { useState, useEffect,useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { socket } from "../../socket";
import "./HostGame.css"; 

export default function HostGame() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");

  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState("waiting"); 
  const [summary, setSummary] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

 

  useEffect(() => {
    if (!roomId) return;

    socket.emit("getCurrentQuestion", { roomId });

    const handlePlayersUpdate = (players) => {
      setPlayers(players);
    };

    const handleQuestion = ({ questionIndex, question }) => {
      setCurrentQuestion(question);
      setCurrentQuestionIndex(questionIndex);
      setPhase("question");
      setSummary(null);

    };

    const handleQuizEnded = ({ players }) => {
      setPlayers(players);
      setPhase("end");
    };

    const handleSummary = ({ answersCount, correctAnswer }) => {
      setSummary({ answersCount, correctAnswer });
      setPhase("summary");
    };

    const handleTimer = ({ endsAt }) => {
      clearInterval(timerRef.current);

      const update = () => {
        const remaining = Math.max(
          0,
          Math.ceil((endsAt - Date.now()) / 1000)
        );

        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
        }
      };

        update(); 
        timerRef.current = setInterval(update, 250);
    };

    socket.on("questionTimerStarted", handleTimer);
    socket.on("playersUpdated", handlePlayersUpdate);
    socket.on("GetQuestionForHost", handleQuestion);
    socket.on("quizEnded", handleQuizEnded);
    socket.on("questionSummary", handleSummary);

    return () => {
      socket.off("playersUpdated", handlePlayersUpdate);
      socket.off("GetQuestionForHost", handleQuestion);
      socket.off("quizEnded", handleQuizEnded);
      socket.off("questionSummary", handleSummary);
      socket.off("questionTimerStarted", handleTimer);
      clearInterval(timerRef.current);
    };
  }, [roomId]);

  const handleNextQuestion = () => {
    socket.emit("nextQuestion", { roomId });
  };

  if (phase === "end") {
    return (
      <div className="host-game-container">
        <h2>🏁 החידון הסתיים!</h2>

        <ol className="results-list">
          {[...players]
            .sort((a, b) => b.score - a.score)
            .map((p, i) => (
              <li key={p.id}>
                #{i + 1} — {p.username} ({p.score} נק')
              </li>
            ))}
        </ol>
      </div>
    );
  }

  if (phase === "summary" && summary) {
    return (
      <div className="summary-box">
        <h2>📊 תוצאות השאלה</h2>

        <ul className="summary-list">
          {Object.entries(summary.answersCount).map(([answer, count]) => (
            <li
              key={answer}
              className={`summary-item ${
                summary.correctAnswer === answer ? "correct-answer" : ""
              }`}
            >
              <span className="summary-answer">{answer}</span>
              <span className="summary-count">{count}</span>
            </li>
          ))}
        </ul>

        <button onClick={handleNextQuestion} className="next-btn">
          לשאלה הבאה ▶
        </button>
      </div>
    );
  }

  if (phase === "question" && currentQuestion) {
    return (
      <div className="host-game-container">
        <h2>שאלה {currentQuestionIndex + 1}</h2>

        <div className={`mega-timer ${timeLeft <= 5 ? "danger" : timeLeft <= 10 ? "warning" : ""}`}>
          <svg className="timer-svg" viewBox="0 0 100 100">
            <circle className="bg" cx="50" cy="50" r="45" />
            <circle
              className="progress"
              cx="50"
              cy="50"
              r="45"
              style={{
                strokeDashoffset: 283 - (283 * timeLeft) / currentQuestion.time
              }}
            />
          </svg>

          <div className="timer-number">
            {timeLeft}
          </div>

        </div>


        <h3 className="question-text">{currentQuestion.text}</h3>

        <ul className="answers-list">
          {currentQuestion.answers.map((ans, idx) => (
            <li key={idx} className="answer-item">
              {ans.text}
            </li>
          ))}
        </ul>

        <button onClick={handleNextQuestion} className="next-btn">
          לשאלה הבאה ▶
        </button>
      </div>
    );
  }

  return (
    <div className="host-game-container">
      <h2>מחכים להתחלת המשחק...</h2>
      <p>אם הגעת לפה בטעות — חזור ליצירת החדר.</p>
    </div>
  );
}
