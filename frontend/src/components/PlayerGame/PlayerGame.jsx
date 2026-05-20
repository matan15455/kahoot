import { useState, useEffect, useRef } from "react";
import { useSearchParams,useNavigate } from "react-router-dom";
import { getSocket } from "../../socket";
import { EpShape, ANSWER_META } from "../_shared/EpBrand";
import ScoreTable from "../ScoreTable/ScoreTable";
import "./PlayerGame.css";

export default function PlayerGame() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");

  const socket = getSocket();

  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const handleRoomUpdated = (roomData) => {
      if (roomData.roomId !== roomId) return;

      setRoom(roomData);

      if (roomData.phase === "QUESTION") {
        setSelectedAnswer(null);
      }

      if (roomData.endsAt) {
        clearInterval(timerRef.current);

        const update = () => {
          const remaining = Math.max(0, Math.ceil((roomData.endsAt - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) clearInterval(timerRef.current);
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

  const handleAnswerClick = (answerText) => {
    if (!room || room.phase !== "QUESTION") return;
    if (selectedAnswer) return;

    setSelectedAnswer(answerText);
    socket.emit("answerQuestion", { roomId, answerText });
  };

  /* ============ Loading ============ */
  if (!room) {
    return (
      <div className="ep-pg ep-pg--state">
        <div className="ep-pg__loader">
          <div className="ep-pg__spinner" />
          <p className="ep-pg__loader-text">טוען משחק…</p>
        </div>
      </div>
    );
  }

  /* ============ END ============ */
  if (room.phase === "END") {
    return (
      <div className="ep-pg">
        <div className="ep-pg__hero">
          <span className="ep-pg__kicker">סוף החידון</span>
          <h1 className="ep-pg__hero-title">
            כל הכבוד!<br />
            <span className="ep-pg__hero-accent">הנה התוצאות.</span>
          </h1>
        </div>
        <ScoreTable players={room.players} />
        <button
            className="ep-pg__wait"
            onClick={() => {
              navigate("/join-room");
            }}
          >
            חזרה
        </button>
      </div>
    );
  }

  /* ============ SUMMARY ============ */
  if (room.phase === "SUMMARY" && room.summary) {
    const entries = Object.entries(room.summary.answersCount);
    const totalAnswers = entries.reduce((sum, [, c]) => sum + c, 0);
    const maxCount = Math.max(...entries.map(([, c]) => c), 1);

    const wasCorrect = selectedAnswer && selectedAnswer === room.summary.correctAnswer;
    const wasWrong = selectedAnswer && selectedAnswer !== room.summary.correctAnswer;

    return (
      <div className="ep-pg">
        {/* בנר תוצאה אישית */}
        <div
          className={
            "ep-pg__verdict" +
            (wasCorrect ? " is-correct" : wasWrong ? " is-wrong" : " is-neutral")
          }
        >
          <div className="ep-pg__verdict-head">
            <p className="ep-pg__verdict-label">
              {wasCorrect && "תשובה נכונה!"}
              {wasWrong && "תשובה שגויה"}
              {!selectedAnswer && "לא ענית בזמן"}
            </p>
            <p className="ep-pg__verdict-sub">
              {wasCorrect && "מהיר ומדויק. ✦"}
              {wasWrong && (
                <>
                  התשובה הנכונה: <strong>{room.summary.correctAnswer}</strong>
                </>
              )}
              {!selectedAnswer && (
                <>
                  התשובה הנכונה: <strong>{room.summary.correctAnswer}</strong>
                </>
              )}
            </p>
          </div>
        </div>

        {/* פירוט תשובות */}
        <div className="ep-pg__sum-wrap">
          <p className="ep-pg__sum-label">איך הצביעו אחרים</p>
          <ul className="ep-pg__sum">
            {entries.map(([answer, count], idx) => {
              const meta = ANSWER_META[idx % ANSWER_META.length];
              const isCorrect = room.summary.correctAnswer === answer;
              const isMine = selectedAnswer === answer;
              const pct = totalAnswers ? (count / totalAnswers) * 100 : 0;
              const widthPct = (count / maxCount) * 100;
              return (
                <li
                  key={answer}
                  className={
                    "ep-pg__sum-row" +
                    (isCorrect ? " is-correct" : "") +
                    (isMine && !isCorrect ? " is-mine-wrong" : "") +
                    (isMine ? " is-mine" : "")
                  }
                >
                  <span
                    className="ep-pg__sum-tag"
                    style={{ background: meta.color, color: meta.textOn }}
                  >
                    {meta.letter}
                  </span>
                  <div className="ep-pg__sum-body">
                    <div className="ep-pg__sum-head">
                      <span className="ep-pg__sum-text">
                        {answer}
                        {isCorrect && (
                          <span className="ep-pg__sum-badge ep-pg__sum-badge--ok">
                            ✓ נכון
                          </span>
                        )}
                        {isMine && (
                          <span className="ep-pg__sum-badge ep-pg__sum-badge--mine">
                            הבחירה שלך
                          </span>
                        )}
                      </span>
                      <span className="ep-pg__sum-count">
                        {count}
                        <span className="ep-pg__sum-pct">· {Math.round(pct)}%</span>
                      </span>
                    </div>
                    <div className="ep-pg__sum-bar">
                      <i style={{ width: widthPct + "%", background: meta.color }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="ep-pg__wait">
          <span className="ep-pg__pulse" />
          ממתינים שהמנחה ימשיך…
        </div>
      </div>
    );
  }

  /* ============ SCORES ============ */
  if (room.phase === "SCORES") {
    return (
      <div className="ep-pg">
        <div className="ep-pg__top">
          <span className="ep-pg__kicker">לוח ניקוד</span>
          <h1 className="ep-pg__top-title">המצב הנוכחי</h1>
        </div>
        <ScoreTable players={room.players} />
        <div className="ep-pg__wait">
          <span className="ep-pg__pulse" />
          ממתינים שהמנחה ימשיך…
        </div>
      </div>
    );
  }

  /* ============ QUESTION ============ */
  if (room.phase === "QUESTION" && room.question) {
    const totalQ = room.questions?.length || room.question.totalQuestions;
    const danger = timeLeft !== null && timeLeft <= 5;
    const warning = timeLeft !== null && timeLeft > 5 && timeLeft <= 10;

    return (
      <div className="ep-pg ep-pg--q">

        {/* ראש: chip + timer */}
        <header className="ep-pg__qhead">
          <span className="ep-pg__chip">
            שאלה {room.questionIndex + 1}
            {totalQ && <> · מתוך {totalQ}</>}
          </span>
          {timeLeft !== null && (
            <div
              className={
                "ep-pg__timer mega-timer" +
                (danger ? " danger" : warning ? " warning" : "")
              }
            >
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
        </header>

        {/* רמז: בחרו תשובה */}
        <div className="ep-pg__hint">
          <p className="ep-pg__hint-label">
            {selectedAnswer ? "תשובתך נשלחה" : "בחרו תשובה"}
          </p>
          {selectedAnswer && (
            <p className="ep-pg__hint-sub">המתינו שהמנחה יסיים את השאלה</p>
          )}
        </div>

        {/* 4 כפתורי תשובה */}
        <ul className="ep-pg__answers">
          {room.question.answers.map((ans, idx) => {
            const meta = ANSWER_META[idx % ANSWER_META.length];
            const isSelected = selectedAnswer === ans.text;
            const isDimmed = selectedAnswer && !isSelected;
            return (
              <li
                key={idx}
                className={
                  "ep-pg__answer" +
                  (isSelected ? " is-selected" : "") +
                  (isDimmed ? " is-dimmed" : "")
                }
                style={{
                  background: meta.color,
                  color: meta.textOn,
                  boxShadow: `0 6px 0 0 ${meta.inkColor}`,
                }}
                onClick={() => handleAnswerClick(ans.text)}
                role="button"
                tabIndex={selectedAnswer ? -1 : 0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !selectedAnswer) {
                    e.preventDefault();
                    handleAnswerClick(ans.text);
                  }
                }}
              >
                <div className="ep-pg__answer-head">
                  <span className="ep-pg__answer-letter">{meta.letter}</span>
                  <span className="ep-pg__answer-glyph" aria-hidden="true">
                    <EpShape kind={meta.shape} size={22} />
                  </span>
                </div>
                <span className="ep-pg__answer-text">{ans.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  /* ============ Default — ממתין ============ */
  return (
    <div className="ep-pg ep-pg--state">
      <div className="ep-pg__loader">
        <div className="ep-pg__spinner" />
        <p className="ep-pg__loader-text">מחכים שהמנחה יתחיל…</p>
      </div>
    </div>
  );
}
