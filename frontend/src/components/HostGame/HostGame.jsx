import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getSocket } from "../../socket";
import "./HostGame.css";
import ScoreTable from "../ScoreTable/ScoreTable";

export default function HostGame() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");

  const socket = getSocket();

  const [room, setRoom] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const handleRoomUpdated = (roomData) => {
      // תטפל רק בעדכון של החדר שאני נמצא בו
      if (roomData.roomId !== roomId) return;

      setRoom(roomData);

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
      <div className="host-wrapper">
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
      <div className="host-wrapper">
        <div className="glass-panel end-screen">
          <h1 className="title-glow">🎉 החידון הסתיים! 🎉</h1>
          <div className="table-wrapper">
            <ScoreTable players={room.players} />
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     SUMMARY (מעודכן עם גרף עמודות)
  ===================================================== */
  if (room.phase === "SUMMARY" && room.summary) {
    // חישוב כמות ההצבעות המקסימלית כדי לייצר אחוזים לגובה העמודות
    const counts = Object.values(room.summary.answersCount);
    const maxCount = Math.max(...counts, 1); // מינימום 1 כדי למנוע חלוקה באפס

    return (
      <div className="host-wrapper">
        <div className="glass-panel summary-screen">
          <h2 className="title-glow">תוצאות השאלה</h2>
          
          <div className="chart-container">
            {Object.entries(room.summary.answersCount).map(([answer, count], index) => {
              const isCorrect = room.summary.correctAnswer === answer;
              // חישוב גובה העמודה באחוזים ביחס לתשובה עם הכי הרבה הצבעות
              const heightPercent = count === 0 ? 2 : (count / maxCount) * 100;

              return (
                <div key={answer} className={`bar-column ${isCorrect ? "correct-bar" : ""}`}>
                  <div className="bar-count-label">{count}</div>
                  
                  <div className="bar-track">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        height: `${heightPercent}%`,
                        animationDelay: `${index * 0.1}s` // השהיה קטנה לכל עמודה בשביל אפקט גל
                      }}
                    ></div>
                  </div>
                  
                  <div className="bar-answer-label">{answer}</div>
                </div>
              );
            })}
          </div>

          <button onClick={handleNext} className="action-btn">
            הצג ניקוד <span className="btn-icon">▶</span>
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
    SCORES (ניקוד ביניים)
  ===================================================== */
  if (room.phase === "SCORES") {
    return (
      <div className="host-wrapper">
        <div className="glass-panel scores-screen">
          <h2 className="title-glow">טבלת מובילים 🏆</h2>
          <div className="table-wrapper">
            <ScoreTable players={room.players} />
          </div>
          <button onClick={handleNext} className="action-btn">
            המשך <span className="btn-icon">▶</span>
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     QUESTION
  ===================================================== */
  if (room.phase === "QUESTION" && room.question) {
    return (
      <div className="host-wrapper">
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
                    strokeDashoffset: 283 - (283 * timeLeft) / room.question.time,
                  }}
                />
              </svg>
              <div className="timer-number">{timeLeft}</div>
            </div>
          )}
        </div>

        <h1 className="main-question-text">{room.question.text}</h1>

        <div className="answers-grid">
          {room.question.answers.map((ans, idx) => (
            <div key={idx} className={`answer-card shape-${idx % 4}`}>
              <span className="answer-text">{ans.text}</span>
            </div>
          ))}
        </div>

        <div className="game-footer">
          <button onClick={handleNext} className="skip-btn">
            סיים שאלה <span className="btn-icon">⏭</span>
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     LOBBY / FALLBACK
  ===================================================== */
  return (
    <div className="host-wrapper">
      <div className="glass-panel text-center pulse-glow">
        <h2 className="title-glow">⏳ ממתין לתחילת המשחק...</h2>
        <p className="subtitle">היכנסו עכשיו והתכוננו!</p>
      </div>
    </div>
  );
}