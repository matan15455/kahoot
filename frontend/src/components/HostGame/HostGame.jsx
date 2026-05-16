import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getSocket } from "../../socket";
import { EpShape, ANSWER_META } from "../_shared/EpBrand";
import ScoreTable from "../ScoreTable/ScoreTable";
import "./HostGame.css";

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
      if (roomData.roomId !== roomId) return;

      setRoom(roomData);

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

  /* ============ Loading ============ */
  if (!room) {
    return (
      <div className="ep-host ep-host--state">
        <div className="ep-host__loader">
          <div className="ep-host__spinner" />
          <p className="ep-host__loader-text">טוען משחק…</p>
        </div>
      </div>
    );
  }

  /* ============ END — סיום החידון ============ */
  if (room.phase === "END") {
    return (
      <div className="ep-host">
        <div className="ep-host__hero">
          <span className="ep-host__kicker">סוף החידון</span>
          <h1 className="ep-host__hero-title">
            ועכשיו — <span className="ep-host__hero-accent">הזוכים.</span>
          </h1>
        </div>
        <ScoreTable players={room.players} />
      </div>
    );
  }

  /* ============ SUMMARY — סיכום שאלה ============ */
  if (room.phase === "SUMMARY" && room.summary) {
    const entries = Object.entries(room.summary.answersCount);
    const totalAnswers = entries.reduce((sum, [, c]) => sum + c, 0);
    const maxCount = Math.max(...entries.map(([, c]) => c), 1);

    return (
      <div className="ep-host">
        <div className="ep-host__top">
          <span className="ep-host__kicker">סיכום</span>
          <h1 className="ep-host__top-title">תוצאות השאלה</h1>
          <p className="ep-host__top-sub">
            {totalAnswers} שחקנים ענו · התשובה הנכונה מודגשת
          </p>
        </div>

        <ul className="ep-host__sum">
          {entries.map(([answer, count], idx) => {
            const meta = ANSWER_META[idx % ANSWER_META.length];
            const isCorrect = room.summary.correctAnswer === answer;
            const pct = totalAnswers ? (count / totalAnswers) * 100 : 0;
            const widthPct = (count / maxCount) * 100;
            return (
              <li
                key={answer}
                className={"ep-host__sum-row" + (isCorrect ? " is-correct" : "")}
              >
                <span
                  className="ep-host__sum-tag"
                  style={{ background: meta.color, color: meta.textOn }}
                >
                  {meta.letter}
                </span>
                <div className="ep-host__sum-body">
                  <div className="ep-host__sum-head">
                    <span className="ep-host__sum-text">
                      {answer}
                      {isCorrect && (
                        <span className="ep-host__sum-correct">✓ נכון</span>
                      )}
                    </span>
                    <span className="ep-host__sum-count">
                      {count}
                      <span className="ep-host__sum-pct">· {Math.round(pct)}%</span>
                    </span>
                  </div>
                  <div className="ep-host__sum-bar">
                    <i
                      style={{
                        width: widthPct + "%",
                        background: meta.color,
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <button onClick={handleNext} className="ep-host__next">
          הצג ניקוד <span aria-hidden="true">←</span>
        </button>
      </div>
    );
  }

  /* ============ SCORES — לוח ניקוד בין שאלות ============ */
  if (room.phase === "SCORES") {
    return (
      <div className="ep-host">
        <div className="ep-host__top">
          <span className="ep-host__kicker">לוח ניקוד</span>
          <h1 className="ep-host__top-title">המצב הנוכחי</h1>
        </div>
        <ScoreTable players={room.players} />
        <button onClick={handleNext} className="ep-host__next">
          המשך <span aria-hidden="true">←</span>
        </button>
      </div>
    );
  }

  /* ============ QUESTION — שאלה חיה ============ */
  if (room.phase === "QUESTION" && room.question) {
    const totalQ = room.questions?.length || room.question.totalQuestions;
    const danger = timeLeft !== null && timeLeft <= 5;
    const warning = timeLeft !== null && timeLeft > 5 && timeLeft <= 10;

    return (
      <div className="ep-host">

        {/* ── ראש ── */}
        <header className="ep-host__qhead">
          <div className="ep-host__qhead-left">
            <span className="ep-host__chip">
              שאלה {room.questionIndex + 1}
              {totalQ && <> · מתוך {totalQ}</>}
            </span>
          </div>

          {timeLeft !== null && (
            <div
              className={
                "ep-host__timer mega-timer" +
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

          <div className="ep-host__qhead-right">
            <button onClick={handleNext} className="ep-host__next ep-host__next--inline">
              סיים שאלה <span aria-hidden="true">←</span>
            </button>
          </div>
        </header>

        {/* ── טקסט השאלה ── */}
        <div className="ep-host__qbox">
          <h2 className="ep-host__qtext">{room.question.text}</h2>
        </div>

        {/* ── 4 התשובות ── */}
        <ul className="ep-host__answers">
          {room.question.answers.map((ans, idx) => {
            const meta = ANSWER_META[idx % ANSWER_META.length];
            return (
              <li
                key={idx}
                className={"ep-host__answer ep-host__answer--" + idx}
                style={{
                  background: meta.color,
                  color: meta.textOn,
                  boxShadow: `0 6px 0 0 ${meta.inkColor}`,
                }}
              >
                <span className="ep-host__answer-letter">{meta.letter}</span>
                <span className="ep-host__answer-glyph" aria-hidden="true">
                  <EpShape kind={meta.shape} size={26} />
                </span>
                <span className="ep-host__answer-text">{ans.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  /* ============ Default — ממתין ============ */
  return (
    <div className="ep-host ep-host--state">
      <div className="ep-host__loader">
        <div className="ep-host__spinner" />
        <p className="ep-host__loader-text">ממתין לתחילת המשחק…</p>
      </div>
    </div>
  );
}
