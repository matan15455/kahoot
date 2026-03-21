import { useState, useEffect, useRef, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { getSocket } from "../../socket";
import "./PlayerGame.css";
import ScoreTable from "../ScoreTable/ScoreTable";

export default function PlayerGame() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");

  const socket = getSocket();

  const [room, setRoom] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const handleRoomUpdated = (roomData) => {
      if (roomData.roomId !== roomId) return;

      setRoom(roomData);

      // אם מתחילה שאלה חדשה – מאפסים תשובה
      if (roomData.phase === "QUESTION") {
        setSelectedAnswer(null);
      }

      // הצגת טיימר
      if (roomData.endsAt) {
        clearInterval(timerRef.current);

        const offset = Date.now() - roomData.serverTime;
        const correctedEndsAt = roomData.endsAt + offset;

        const update = () => {
          const remaining = Math.max(0, Math.ceil((correctedEndsAt - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) clearInterval(timerRef.current);
        };

        update();
        timerRef.current = setInterval(update, 1000);
      } else {
        setTimeLeft(null);
        clearInterval(timerRef.current);
      }
    };

    socket.emit("requestRoomState", { roomId });
    socket.on("roomUpdated", handleRoomUpdated);

    return () => {
      socket.off("roomUpdated", handleRoomUpdated);
      clearInterval(timerRef.current);
    };
  }, [roomId]);

  /* =====================================================
     Answer
  ===================================================== */
  const handleAnswerClick = (answerText) => {
    if (!room || room.phase !== "QUESTION") return;
    if (selectedAnswer) return;

    setSelectedAnswer(answerText);

    socket.emit("answerQuestion", {
      roomId,
      answerText
    });
  };

  /* =====================================================
     Guards
  ===================================================== */
  if (!room) {
    return (
      <div className="player-wrapper">
        <div className="glass-panel text-center">
          <div className="loader"></div>
          <h2 className="loading-text">טוען משחק...</h2>
        </div>
      </div>
    );
  }

  /* =====================================================
     END
  ===================================================== */
  if (room.phase === "END") {
    return (
      <div className="player-wrapper">
        <div className="glass-panel end-screen">
          <h1 className="title-glow">🏁 המשחק הסתיים!</h1>
          <div className="table-wrapper">
            <ScoreTable players={room.players} />
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     SUMMARY
  ===================================================== */
  if (room.phase === "SUMMARY" && room.summary) {
    const isCorrect = room.summary.correctAnswer === selectedAnswer;

    return (
      <div className="player-wrapper">
        <div className="glass-panel summary-screen">
          
          {/* חיווי אישי לשחקן האם צדק או טעה */}
          <div className={`personal-feedback ${isCorrect ? "feedback-correct" : "feedback-wrong"}`}>
            {isCorrect ? "🎉 צדקת!" : "❌ טעית..."}
          </div>

          <h2 className="subtitle">תוצאות השאלה</h2>

          <ul className="summary-list">
            {Object.entries(room.summary.answersCount).map(([answer, count]) => {
              const isAnswerCorrect = room.summary.correctAnswer === answer;
              const isPlayerChoice = selectedAnswer === answer && !isAnswerCorrect;

              return (
                <li
                  key={answer}
                  className={`summary-item 
                    ${isAnswerCorrect ? "correct-answer pulse-glow" : ""} 
                    ${isPlayerChoice ? "wrong-answer" : ""}
                  `}
                >
                  <span className="summary-answer">
                    {answer} {selectedAnswer === answer && " (הבחירה שלך)"}
                  </span>
                  <span className="summary-count-badge">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  /* =====================================================
    SCORES (ניקוד ביניים)
  ===================================================== */
  if (room.phase === "SCORES") {
    return (
      <div className="player-wrapper">
        <div className="glass-panel scores-screen">
          <div className="table-wrapper">
            <ScoreTable players={room.players} />
          </div>
          <p className="waiting-text pulse-text">
            ⏳ ממתינים למארח להמשך המשחק...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     QUESTION
  ===================================================== */
  if (room.phase === "QUESTION" && room.question) {
    return (
      <div className="player-wrapper">
        <div className="game-header">
          <div className="question-badge">שאלה {room.questionIndex + 1}</div>

          {timeLeft !== null && (
            <div className={`mega-timer ${timeLeft <= 5 ? "danger" : timeLeft <= 10 ? "warning" : ""}`}>
              <svg className="timer-svg" viewBox="0 0 100 100">
                <circle className="bg" cx="50" cy="50" r="45" />
                <circle
                  className="progress"
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDashoffset: 283 - (283 * timeLeft) / room.question.time
                  }}
                />
              </svg>
              <div className="timer-number">{timeLeft}</div>
            </div>
          )}
        </div>

        <h2 className="mobile-question-text">{room.question.text}</h2>

        <div className="player-answers-grid">
          {room.question.answers.map((ans, index) => {
            const isSelected = selectedAnswer === ans.text;
            const isDisabled = selectedAnswer !== null;

            return (
              <button
                key={index}
                onClick={() => handleAnswerClick(ans.text)}
                disabled={isDisabled}
                className={`player-answer-btn shape-${index % 4} 
                  ${isSelected ? "selected" : ""} 
                  ${isDisabled && !isSelected ? "dimmed" : ""}
                `}
              >
                <span className="answer-text">{ans.text}</span>
              </button>
            );
          })}
        </div>

        {selectedAnswer && (
          <div className="waiting-text pulse-text mt-3">
            התשובה נקלטה! ממתין לסיום הזמן...
          </div>
        )}
      </div>
    );
  }

  /* =====================================================
     LOBBY / WAITING
  ===================================================== */
  return (
    <div className="player-wrapper">
      <div className="glass-panel text-center pulse-glow">
        <h2 className="title-glow">⏳ הכינו את האצבעות!</h2>
        <p className="subtitle">מחכים שהמארח יתחיל את המשחק...</p>
      </div>
    </div>
  );
}