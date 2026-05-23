import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CircularProgress from "@mui/material/CircularProgress";
import "./Statistics.css";

export default function Statistics() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("http://localhost:5000/stats/my-sessions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSessions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  if (loading) {
    return (
      <div className="ep-stat ep-stat--state">
        <CircularProgress sx={{ color: "var(--ep-primary)" }} size={48} />
      </div>
    );
  }

  // קבץ לפי quizId כדי לחשב מספר הפעלה
  const runCountMap = {};
  const sessionsWithRun = [...sessions]
    .reverse()
    .map((s) => {
      const key = s.quizId;
      runCountMap[key] = (runCountMap[key] || 0) + 1;
      return { ...s, runNumber: runCountMap[key] };
    })
    .reverse();

  return (
    <div className="ep-stat">
      <header className="ep-stat__head">
        <div>
          <p className="ep-stat__kicker">היסטוריה</p>
          <h1 className="ep-stat__title">המשחקים שלי</h1>
        </div>
        {sessions.length > 0 && (
          <div className="ep-stat__summary">
            <div className="ep-stat__summary-item">
              <span className="ep-stat__summary-val">{sessions.length}</span>
              <span className="ep-stat__summary-label">משחקים</span>
            </div>
            <div className="ep-stat__summary-item">
              <span className="ep-stat__summary-val">
                {sessions.reduce((s, g) => s + g.players.length, 0)}
              </span>
              <span className="ep-stat__summary-label">שחקנים סה"כ</span>
            </div>
            <div className="ep-stat__summary-item">
              <span className="ep-stat__summary-val">
                {new Set(sessions.map((s) => s.quizId)).size}
              </span>
              <span className="ep-stat__summary-label">חידונים שונים</span>
            </div>
          </div>
        )}
      </header>

      {sessions.length === 0 ? (
        <div className="ep-stat__empty">
          <div className="ep-stat__empty-icon">📊</div>
          <h2 className="ep-stat__empty-title">אין משחקים עדיין</h2>
          <p className="ep-stat__empty-sub">
            הפעילו חידון וסטטיסטיקות המשחק יופיעו כאן
          </p>
          <button
            className="ep-stat__empty-btn"
            onClick={() => navigate("/my-quizzes")}
          >
            לחידונים שלי ←
          </button>
        </div>
      ) : (
        <ul className="ep-stat__list">
          {sessionsWithRun.map((session) => {
            const date = new Date(session.createdAt);
            const dateStr = date.toLocaleDateString("he-IL", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            });
            const timeStr = date.toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit"
            });

            const avgScore =
              session.players.length > 0
                ? Math.round(
                    session.players.reduce((s, p) => s + p.score, 0) /
                      session.players.length
                  )
                : 0;

            const correctPct =
              session.questions.length > 0
                ? Math.round(
                    (session.questions.reduce(
                      (s, q) => s + q.totalCorrect,
                      0
                    ) /
                      Math.max(
                        1,
                        session.questions.reduce(
                          (s, q) => s + q.totalAnswered,
                          0
                        )
                      )) *
                      100
                  )
                : 0;

            return (
              <li
                key={session._id}
                className="ep-stat__row"
                onClick={() => navigate(`/statistics/${session._id}`)}
              >
                <div className="ep-stat__row-main">
                  <div className="ep-stat__row-title-wrap">
                    <span className="ep-stat__row-run">הפעלה #{session.runNumber}</span>
                    <h3 className="ep-stat__row-title">{session.quizTitle}</h3>
                  </div>
                  <div className="ep-stat__row-date">
                    <span>{dateStr}</span>
                    <span className="ep-stat__row-time">{timeStr}</span>
                  </div>
                </div>

                <div className="ep-stat__row-chips">
                  <span className="ep-stat__chip">
                    <span className="ep-stat__chip-icon">👥</span>
                    {session.players.length} שחקנים
                  </span>
                  <span className="ep-stat__chip">
                    <span className="ep-stat__chip-icon">❓</span>
                    {session.questions.length} שאלות
                  </span>
                  <span className="ep-stat__chip">
                    <span className="ep-stat__chip-icon">⭐</span>
                    ממוצע {avgScore} נק'
                  </span>
                  <span
                    className={
                      "ep-stat__chip ep-stat__chip--pct" +
                      (correctPct >= 70
                        ? " is-good"
                        : correctPct >= 40
                        ? " is-mid"
                        : " is-low")
                    }
                  >
                    {correctPct}% נכונות
                  </span>
                </div>

                <span className="ep-stat__row-arrow">←</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}