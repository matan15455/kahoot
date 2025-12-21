import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getSocket } from "../../socket";
import "./HostGame.css";

export default function HostGame() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");

  const socket = getSocket();

  const [room, setRoom] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!roomId) 
      return;

    const handleRoomUpdated = (roomData) => {
      // תטפל רק בעדכון של החדר שאני נמצא בו
      if (roomData.roomId !== roomId) 
        return;

      setRoom(roomData);

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

    socket.on("roomUpdated", handleRoomUpdated);

    socket.emit("requestRoomState", { roomId });

    return () => {
      socket.off("roomUpdated", handleRoomUpdated);
      clearInterval(timerRef.current);
    };
  }, [roomId]);

 
  const handleNext = () => {
    socket.emit("nextQuestion", { roomId });
  };

  /* =====================================================
     UI Guards
  ===================================================== */
  if (!room) {
    return (
      <div className="host-game-container">
        <h2>טוען משחק…</h2>
      </div>
    );
  }

  /* =====================================================
     END
  ===================================================== */
  if (room.phase === "END") {
    return (
      <div className="host-game-container">
        <h2>🏁 החידון הסתיים!</h2>

        <ol className="results-list">
          {[...room.players]
            .sort((a, b) => b.score - a.score)
            .map((p, i) => (
              <li key={p.userId}>
                #{i + 1} — {p.username} ({p.score} נק')
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
                className={`summary-item ${
                  room.summary.correctAnswer === answer
                    ? "correct-answer"
                    : ""
                }`}
              >
                <span className="summary-answer">{answer}</span>
                <span className="summary-count">{count}</span>
              </li>
            )
          )}
        </ul>

        <button onClick={handleNext} className="next-btn">
          הצג ניקוד ▶
        </button>

      </div>
    );
  }
  
  /* =====================================================
    SCORES (ניקוד ביניים)
  ===================================================== */
  if (room.phase === "SCORES") {
    return (
      <div className="host-game-container">
        <h2>🏆 ניקוד ביניים</h2>

        <ol className="results-list">
          {[...room.players]
            .sort((a, b) => b.score - a.score)
            .map((p, i) => (
              <li key={p.userId}>
                #{i + 1} — {p.username} ({p.score} נק')
              </li>
            ))}
        </ol>

        <button onClick={handleNext} className="next-btn">
          המשך ▶
        </button>
      </div>
    );
  }


  /* =====================================================
     QUESTION
  ===================================================== */
  if (room.phase === "QUESTION" && room.question) {
    return (
      <div className="host-game-container">
        <h2>שאלה {room.questionIndex + 1}</h2>

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

        <h3 className="question-text">{room.question.text}</h3>

        <ul className="answers-list">
          {room.question.answers.map((ans, idx) => (
            <li key={idx} className="answer-item">
              {ans.text}
            </li>
          ))}
        </ul>

        <button onClick={handleNext} className="next-btn">
          סיים שאלה ▶
        </button>
      </div>
    );
  }

  /* =====================================================
     LOBBY / FALLBACK
  ===================================================== */
  return (
    <div className="host-game-container">
      <h2>⏳ ממתין לתחילת המשחק…</h2>
    </div>
  );
}
