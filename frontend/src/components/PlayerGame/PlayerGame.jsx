import { useState, useEffect,useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { socket } from "../../socket";
import "./PlayerGame.css";

export default function PlayerGame() {
  const [searchParams] = useSearchParams();

  const roomId = searchParams.get("roomId");
  const userId = socket.id;

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [canAnswer, setCanAnswer] = useState(false);
  const [players, setPlayers] = useState([]);
  const [phase, setPhase] = useState("waiting"); // waiting | question | summary | end
  const [summary, setSummary] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);


  useEffect(() => {
    if (!roomId) return;

    socket.emit("getCurrentQuestion", { roomId });

    // קבלת שאלה
    const handleQuestion = ({ questionIndex, question }) => {
      setPhase("question");
      setSummary(null);

      setCurrentIndex(questionIndex);
      setCurrentQuestion(question);
      setCanAnswer(true);

    };

    // קבלת סיכום שאלה
    const handleSummary = ({ answersCount, correctAnswer }) => {
      setSummary({ answersCount, correctAnswer });
      setPhase("summary");

    };

    // עדכון שחקנים
    const handlePlayersUpdate = (players) => {
      setPlayers(players);
    };

    // סוף משחק
    const handleQuizEnded = ({ players }) => {
      setPlayers(players);
      setPhase("end");
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

      update(); // פעם ראשונה
      timerRef.current = setInterval(update, 250);
    };

    socket.on("questionTimerStarted", handleTimer);
    socket.on("GetQuestionForPlayer", handleQuestion);
    socket.on("playersUpdated", handlePlayersUpdate);
    socket.on("quizEnded", handleQuizEnded);
    socket.on("questionSummary", handleSummary);

    return () => {
      socket.off("GetQuestionForPlayer", handleQuestion);
      socket.off("questionSummary",handleSummary);
      socket.off("playersUpdated", handlePlayersUpdate);
      socket.off("quizEnded", handleQuizEnded);
      socket.off("questionTimerStarted", handleTimer);
      clearInterval(timerRef.current);
    };
  }, [roomId]);

  // שליחת תשובה
  const handleAnswerClick = (answerText) => {
    if (!canAnswer)
       return;

    setSelectedAnswer(answerText);

    socket.emit("answerQuestion", {
      roomId,
      userId,
      answerText,
    });

    setCanAnswer(false);
  };


  if (phase === "end") {
    return (
      <div className="player-game-container">
        <h1>🏁 המשחק הסתיים!</h1>
        <h2>תוצאות:</h2>

        <ol>
          {[...players]
            .sort((a, b) => b.score - a.score)
            .map((p, index) => (
              <li key={p.id}>
                {index + 1}. {p.username} — {p.score} נק'
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
              className={`summary-item 
                ${summary.correctAnswer === answer ? "correct-answer" : ""} 
                ${selectedAnswer === answer && summary.correctAnswer !== answer ? "wrong-answer" : ""}
              `}
            >
              <span className="summary-answer">{answer}</span>
              <span className="summary-count">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }


  if (phase === "question" && currentQuestion) {
    return (
      <div className="player-game-container">
        <h1>שאלה {currentIndex + 1}</h1>

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

        <ul className="answer-buttons">
          {currentQuestion.answers.map((ans, index) => (
            <li
              key={index}
              className={`answer-button ${!canAnswer ? "disabled" : ""}`}
              onClick={() => handleAnswerClick(ans.text)}
            >
              {ans.text}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="player-game-container">
      <h1>המארח עדיין לא התחיל את החידון…</h1>
    </div>
  );
}
