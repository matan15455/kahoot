import { useState, useEffect, useMemo } from "react";
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

  const [search, setSearch] = useState("");
  const [quizFilter, setQuizFilter] = useState("__all__");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | players

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

  /* ── חישוב מספר הפעלה לכל session ── */
  const sessionsWithRun = useMemo(() => {
    const runCountMap = {};
    return [...sessions]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // ישן→חדש לספירה
      .map((s) => {
        const key = s.quizId;
        runCountMap[key] = (runCountMap[key] || 0) + 1;
        return { ...s, runNumber: runCountMap[key] };
      });
  }, [sessions]);

  /* ── רשימת חידונים ייחודית ל-dropdown ── */
  const uniqueQuizzes = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      if (!map.has(s.quizId)) {
        map.set(s.quizId, { id: s.quizId, title: s.quizTitle, count: 0 });
      }
      map.get(s.quizId).count += 1;
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [sessions]);

  /* ── סינון + מיון לתצוגה ── */
  const visible = useMemo(() => {
    let list = sessionsWithRun;

    if (quizFilter !== "__all__") {
      list = list.filter((s) => s.quizId === quizFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.quizTitle.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      if (sortBy === "newest") 
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") 
        return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "players")
         return b.players.length - a.players.length;
      return 0;
    });

    return list;
  }, [sessionsWithRun, quizFilter, search, sortBy]);

  if (loading) {
    return (
      <div className="ep-stat ep-stat--state">
        <CircularProgress sx={{ color: "var(--ep-primary)" }} size={48} />
      </div>
    );
  }

  const totalPlayers = sessions.reduce((s, g) => s + g.players.length, 0);

  return (
    <div className="ep-stat">
      {/* ── כותרת ── */}
      <header className="ep-stat__head">
        <div>
          <p className="ep-stat__kicker">סטטיסטיקות</p>
          <h1 className="ep-stat__title">המשחקים שהפעלתי</h1>
        </div>

        {sessions.length > 0 && (
          <div className="ep-stat__summary">
            <div className="ep-stat__summary-item">
              <span className="ep-stat__summary-val">{sessions.length}</span>
              <span className="ep-stat__summary-label">משחקים</span>
            </div>
            <div className="ep-stat__summary-item">
              <span className="ep-stat__summary-val">{totalPlayers}</span>
              <span className="ep-stat__summary-label">שחקנים סה"כ</span>
            </div>
            <div className="ep-stat__summary-item">
              <span className="ep-stat__summary-val">{uniqueQuizzes.length}</span>
              <span className="ep-stat__summary-label">חידונים שונים</span>
            </div>
          </div>
        )}
      </header>

      {/* ── EMPTY ── */}
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
            לחידונים שלי
          </button>
        </div>
      ) : (
        <>
          {/* ── בקרי סינון ── */}
          <div className="ep-stat__controls">
            <div className="ep-stat__search">
              <input
                className="ep-stat__search-input"
                type="text"
                placeholder="חיפוש לפי שם חידון…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="ep-stat__search-clear"
                  onClick={() => setSearch("")}
                  aria-label="נקה חיפוש"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              className="ep-stat__select"
              value={quizFilter}
              onChange={(e) => setQuizFilter(e.target.value)}
              aria-label="סינון לפי חידון"
            >
              <option value="__all__">כל החידונים ({sessions.length})</option>
              {uniqueQuizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.count})
                </option>
              ))}
            </select>

            <select
              className="ep-stat__select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="מיון"
            >
              <option value="newest">חדש → ישן</option>
              <option value="oldest">ישן → חדש</option>
              <option value="players">לפי מס' שחקנים</option>
            </select>
          </div>

          {/* ── רשימה ── */}
          {visible.length === 0 ? (
            <div className="ep-stat__no-results">
              <p>לא נמצאו תוצאות עבור החיפוש שלך.</p>
              <button
                className="ep-stat__no-results-clear"
                onClick={() => { setSearch(""); setQuizFilter("__all__"); }}
              >
                נקה סינון
              </button>
            </div>
          ) : (
            <ul className="ep-stat__list">
              {visible.map((session) => {
                const date = new Date(session.createdAt);
                const dateStr = date.toLocaleDateString("he-IL", {
                  day: "2-digit", month: "2-digit", year: "numeric"
                });
                const timeStr = date.toLocaleTimeString("he-IL", {
                  hour: "2-digit", minute: "2-digit"
                });

                const avgScore =
                  session.players.length > 0
                    ? Math.round(
                        session.players.reduce((s, p) => s + p.score, 0) /
                          session.players.length
                      )
                    : 0;

                const totalCorrect = session.questions.reduce((s, q) => s + q.totalCorrect, 0);
                const totalAns = session.questions.reduce((s, q) => s + q.totalAnswered, 0);
                const correctPct = totalAns > 0
                  ? Math.round((totalCorrect / totalAns) * 100)
                  : 0;

                return (
                  <li
                    key={session._id}
                    className="ep-stat__row"
                    onClick={() => navigate(`/statistics/${session._id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/statistics/${session._id}`);
                      }
                    }}
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
                        {session.players.length} שחקנים
                      </span>
                      <span className="ep-stat__chip">
                        {session.questions.length} שאלות
                      </span>
                      <span className="ep-stat__chip">
                        ממוצע {avgScore.toLocaleString()} נק'
                      </span>
                      <span
                        className={
                          "ep-stat__chip ep-stat__chip--pct" +
                          (correctPct >= 70 ? " is-good"
                            : correctPct >= 40 ? " is-mid"
                            : " is-low")
                        }
                      >
                        {correctPct}% נכונות
                      </span>
                    </div>

                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
