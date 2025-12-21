import { useState, useEffect, useRef, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { socket } from "../../socket";
import "./PlayerGame.css";

export default function PlayerGame() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");

  const [room, setRoom] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const timerRef = useRef(null);


  useEffect(() => {
    if (!roomId) 
      return;

    const handleRoomUpdated = (roomData) => {
      if (roomData.roomId !== roomId) 
        return;

      setRoom(roomData);

      // אם מתחילה שאלה חדשה – מאפסים תשובה
      if (roomData.phase === "QUESTION") {
        setSelectedAnswer(null);
      }

      // הצגת טיימר
      if (roomData.endsAt) {
        clearInterval(timerRef.current);

        const update = () => {
          const remaining = Math.max(
            0,
            Math.ceil((roomData.endsAt - Date.now()) / 1000)
          );

          setTimeLeft(remaining);

          if (remaining <= 0) {
            clearInterval(timerRef.current);
          }
        };

        update();
        timerRef.current = setInterval(update, 250);
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
    if (!room || room.phase !== "QUESTION") 
      return;
    if (selectedAnswer) 
      return;

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
      <div className="player-game-container">
        <h2>טוען משחק…</h2>
      </div>
    );
  }

  /* =====================================================
     END
  ===================================================== */
  if (room.phase === "END") {
    return (
      <div className="player-game-container">
        <h1>🏁 המשחק הסתיים!</h1>

        <ol>
          {[...room.players]
            .sort((a, b) => b.score - a.score)
            .map((p, index) => (
              <li key={p.userId}>
                {index + 1}. {p.username} — {p.score} נק'
              </li>
            ))}
        </ol>
      </div>
    );
  }

  /* =====================================================
     SUMMARY
  ===================================================== */
  if (room.phase === "SUMMARY" && room.summary) {
    return (
      <div className="summary-box">
        <h2>תוצאות השאלה</h2>

        <ul className="summary-list">
          {Object.entries(room.summary.answersCount).map(
            ([answer, count]) => (
              <li
                key={answer}
                className={`summary-item
                  ${
                    room.summary.correctAnswer === answer
                      ? "correct-answer"
                      : ""
                  }
                  ${
                    selectedAnswer === answer &&
                    room.summary.correctAnswer !== answer
                      ? "wrong-answer"
                      : ""
                  }
                `}
              >
                <span className="summary-answer">{answer}</span>
                <span className="summary-count">{count}</span>
              </li>
            )
          )}
        </ul>
      </div>
    );
  }


  /* =====================================================
    SCORES (ניקוד ביניים)
  ===================================================== */
  if (room.phase === "SCORES") {
    return (
      <div className="player-game-container">
        <h2>🏆 ניקוד ביניים</h2>

        <ol className="results-list">
          {[...room.players]
            .sort((a, b) => b.score - a.score)
            .map((p, index) => (
              <li key={p.userId}>
                #{index + 1} — {p.username} ({p.score} נק')
              </li>
            ))}
        </ol>

        <p className="waiting-text">
          ⏳ ממתינים למארח להמשך המשחק…
        </p>
      </div>
    );
  }


  /* =====================================================
     QUESTION
  ===================================================== */
  if (room.phase === "QUESTION" && room.question) {
    return (
      <div className="player-game-container">
        <h1>שאלה {room.questionIndex + 1}</h1>

        {timeLeft !== null && (
          <div
            className={`mega-timer ${
              timeLeft <= 5
                ? "danger"
                : timeLeft <= 10
                ? "warning"
                : ""
            }`}
          >
            <svg className="timer-svg" viewBox="0 0 100 100">
              <circle className="bg" cx="50" cy="50" r="45" />
              <circle
                className="progress"
                cx="50"
                cy="50"
                r="45"
                style={{
                  strokeDashoffset:
                    283 -
                    (283 * timeLeft) / room.question.time
                }}
              />
            </svg>
            <div className="timer-number">{timeLeft}</div>
          </div>
        )}

        <ul className="answer-buttons">
          {room.question.answers.map((ans, index) => (
            <li
              key={index}
              className={`answer-button ${
                selectedAnswer ? "disabled" : ""
              }`}
              onClick={() => handleAnswerClick(ans.text)}
            >
              {ans.text}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  /* =====================================================
     LOBBY / WAITING
  ===================================================== */
  return (
    <div className="player-game-container">
      <h1>⏳ מחכים שהמארח יתחיל…</h1>
    </div>
  );
}
