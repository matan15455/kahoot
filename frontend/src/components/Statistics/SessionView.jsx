import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ANSWER_META } from "../_shared/EpBrand";
import CircularProgress from "@mui/material/CircularProgress";
import "./SessionView.css";

export default function SessionView() {
  const { sessionId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("players"); // "players" | "questions"
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/stats/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSession(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId, token]);

  if (loading) {
    return (
      <div className="ep-sv ep-sv--state">
        <CircularProgress sx={{ color: "var(--ep-primary)" }} size={48} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="ep-sv ep-sv--state">
        <p>המשחק לא נמצא</p>
      </div>
    );
  }

  const sorted = [...session.players].sort((a, b) => b.score - a.score);
  const date = new Date(session.createdAt);
  const dateStr = date.toLocaleDateString("he-IL", {
    day: "2-digit", month: "long", year: "numeric"
  });
  const timeStr = date.toLocaleTimeString("he-IL", {
    hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="ep-sv">

      {/* ── ראש ── */}
      <header className="ep-sv__head">
        <button className="ep-sv__back" onClick={() => navigate("/statistics")}>
          ← חזרה
        </button>
        <div className="ep-sv__head-body">
          <p className="ep-sv__kicker">דוח משחק · {dateStr} · {timeStr}</p>
          <h1 className="ep-sv__title">{session.quizTitle}</h1>
        </div>
        <div className="ep-sv__meta-chips">
          <span className="ep-sv__meta-chip">👥 {session.players.length} שחקנים</span>
          <span className="ep-sv__meta-chip">❓ {session.questions.length} שאלות</span>
        </div>
      </header>

      {/* ── טאבים ── */}
      <div className="ep-sv__tabs">
        <button
          className={"ep-sv__tab" + (tab === "players" ? " is-active" : "")}
          onClick={() => { setTab("players"); setSelectedPlayer(null); }}
        >
          שחקנים ({session.players.length})
        </button>
        <button
          className={"ep-sv__tab" + (tab === "questions" ? " is-active" : "")}
          onClick={() => { setTab("questions"); setSelectedQuestion(null); }}
        >
          שאלות ({session.questions.length})
        </button>
      </div>

      {/* ══ טאב שחקנים ══ */}
      {tab === "players" && !selectedPlayer && (
        <div className="ep-sv__panel">
          <table className="ep-sv__table">
            <thead>
              <tr>
                <th>דירוג</th>
                <th>כינוי</th>
                <th>תשובות נכונות</th>
                <th>לא ענה</th>
                <th>ניקוד סופי</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((player, idx) => {
                const correctCount = player.answers.filter(a => a.isCorrect).length;
                const answeredCount = player.answers.length;
                const unanswered = session.questions.length - answeredCount;
                const pct = answeredCount > 0
                  ? Math.round((correctCount / session.questions.length) * 100)
                  : 0;

                return (
                  <tr
                    key={player.nickname}
                    className="ep-sv__tr--clickable"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <td>
                      <span className={"ep-sv__rank ep-sv__rank--" + (idx + 1)}>
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="ep-sv__player-cell">
                        <span className="ep-sv__avatar">
                          {player.nickname.charAt(0)}
                        </span>
                        <span className="ep-sv__player-name">{player.nickname}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ep-sv__correct-cell">
                        <span className="ep-sv__donut-wrap">
                          <svg viewBox="0 0 36 36" className="ep-sv__donut">
                            <circle cx="18" cy="18" r="14" fill="none"
                              stroke="rgba(20,18,26,0.1)" strokeWidth="4"/>
                            <circle cx="18" cy="18" r="14" fill="none"
                              stroke={pct >= 70 ? "var(--ep-ok)" : pct >= 40 ? "var(--ep-warn)" : "var(--ep-bad)"}
                              strokeWidth="4"
                              strokeDasharray={`${pct * 0.88} 88`}
                              strokeLinecap="round"
                              transform="rotate(-90 18 18)"
                            />
                          </svg>
                        </span>
                        <span className="ep-sv__pct">{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={unanswered > 0 ? "ep-sv__unanswered" : "ep-sv__dash"}>
                        {unanswered > 0 ? unanswered : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="ep-sv__score">
                        {player.score.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="ep-sv__row-arrow">←</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ פרטי שחקן ══ */}
      {tab === "players" && selectedPlayer && (
        <div className="ep-sv__panel">
          <button
            className="ep-sv__back-inner"
            onClick={() => setSelectedPlayer(null)}
          >
            ← כל השחקנים
          </button>

          {/* Hero */}
          <div className="ep-sv__player-hero">
            <div className="ep-sv__player-hero-left">
              <div className="ep-sv__player-big-avatar">
                {selectedPlayer.nickname.charAt(0)}
              </div>
              <div>
                <h2 className="ep-sv__player-hero-name">{selectedPlayer.nickname}</h2>
                <div className="ep-sv__player-hero-meta">
                  {(() => {
                    const rank = sorted.findIndex(p => p.nickname === selectedPlayer.nickname) + 1;
                    const correctCount = selectedPlayer.answers.filter(a => a.isCorrect).length;
                    const pct = Math.round((correctCount / session.questions.length) * 100);
                    return (
                      <>
                        <span>דירוג {rank} מתוך {sorted.length}</span>
                        <span>·</span>
                        <span>{pct}% נכונות</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="ep-sv__player-hero-score">
              <span className="ep-sv__player-hero-score-val">
                {selectedPlayer.score.toLocaleString()}
              </span>
              <span className="ep-sv__player-hero-score-label">נקודות</span>
            </div>
          </div>

          {/* טבלת תשובות */}
          <table className="ep-sv__table ep-sv__table--answers">
            <thead>
              <tr>
                <th>#</th>
                <th>שאלה</th>
                <th>תשובה</th>
                <th>תוצאה</th>
                <th>זמן</th>
                <th>נקודות</th>
              </tr>
            </thead>
            <tbody>
              {session.questions.map((q, idx) => {
                const ans = selectedPlayer.answers.find(a => a.questionIndex === idx);
                return (
                  <tr key={idx}>
                    <td>
                      <span className="ep-sv__q-num">{idx + 1}</span>
                    </td>
                    <td className="ep-sv__q-text-cell">
                      {q.text.length > 55 ? q.text.slice(0, 55) + "…" : q.text}
                    </td>
                    <td>
                      {ans ? (
                        <span className="ep-sv__answered-text">
                          {(() => {
                            const metaIdx = session.questions[idx]
                              ? undefined : 0;
                            return ans.answered;
                          })()}
                        </span>
                      ) : (
                        <span className="ep-sv__no-answer">לא ענה</span>
                      )}
                    </td>
                    <td>
                      {ans ? (
                        <span className={"ep-sv__result" + (ans.isCorrect ? " is-correct" : " is-wrong")}>
                          {ans.isCorrect ? "✓ נכון" : "✕ שגוי"}
                        </span>
                      ) : (
                        <span className="ep-sv__result is-neutral">—</span>
                      )}
                    </td>
                    <td>
                      <span className="ep-sv__time-val">
                        {ans ? `${ans.timeToAnswer}s` : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="ep-sv__pts-val">
                        {ans ? ans.pointsEarned : 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ טאב שאלות ══ */}
      {tab === "questions" && !selectedQuestion && (
        <div className="ep-sv__panel">
          <table className="ep-sv__table">
            <thead>
              <tr>
                <th>#</th>
                <th>שאלה</th>
                <th>סוג</th>
                <th>נכונות / שגויות</th>
              </tr>
            </thead>
            <tbody>
              {session.questions.map((q, idx) => {
                const pct = q.totalAnswered > 0
                  ? Math.round((q.totalCorrect / q.totalAnswered) * 100)
                  : 0;
                return (
                  <tr
                    key={idx}
                    className="ep-sv__tr--clickable"
                    onClick={() => setSelectedQuestion(q)}
                  >
                    <td><span className="ep-sv__q-num">{idx + 1}</span></td>
                    <td className="ep-sv__q-text-cell">
                      {q.text.length > 65 ? q.text.slice(0, 65) + "…" : q.text}
                    </td>
                    <td><span className="ep-sv__type-badge">Quiz</span></td>
                    <td>
                      <div className="ep-sv__correct-cell">
                        <span className="ep-sv__donut-wrap">
                          <svg viewBox="0 0 36 36" className="ep-sv__donut">
                            <circle cx="18" cy="18" r="14" fill="none"
                              stroke="rgba(20,18,26,0.1)" strokeWidth="4"/>
                            <circle cx="18" cy="18" r="14" fill="none"
                              stroke={pct >= 70 ? "var(--ep-ok)" : pct >= 40 ? "var(--ep-warn)" : "var(--ep-bad)"}
                              strokeWidth="4"
                              strokeDasharray={`${pct * 0.88} 88`}
                              strokeLinecap="round"
                              transform="rotate(-90 18 18)"
                            />
                          </svg>
                        </span>
                        <span className="ep-sv__pct">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ פרטי שאלה ══ */}
      {tab === "questions" && selectedQuestion && (
        <div className="ep-sv__panel">
          <button
            className="ep-sv__back-inner"
            onClick={() => setSelectedQuestion(null)}
          >
            ← כל השאלות
          </button>

          <div className="ep-sv__q-hero">
            <span className="ep-sv__q-hero-num">
              שאלה {session.questions.indexOf(selectedQuestion) + 1}
            </span>
            <h2 className="ep-sv__q-hero-text">{selectedQuestion.text}</h2>

            <div className="ep-sv__q-stats-row">
              <div className="ep-sv__q-stat">
                <span className="ep-sv__q-stat-val">{selectedQuestion.totalAnswered}</span>
                <span className="ep-sv__q-stat-label">ענו</span>
              </div>
              <div className="ep-sv__q-stat">
                <span className="ep-sv__q-stat-val" style={{ color: "var(--ep-ok)" }}>
                  {selectedQuestion.totalCorrect}
                </span>
                <span className="ep-sv__q-stat-label">נכון</span>
              </div>
              <div className="ep-sv__q-stat">
                <span className="ep-sv__q-stat-val" style={{ color: "var(--ep-bad)" }}>
                  {selectedQuestion.totalAnswered - selectedQuestion.totalCorrect}
                </span>
                <span className="ep-sv__q-stat-label">שגוי</span>
              </div>
              <div className="ep-sv__q-stat">
                <span className="ep-sv__q-stat-val">
                  {selectedQuestion.totalAnswered > 0
                    ? Math.round((selectedQuestion.totalCorrect / selectedQuestion.totalAnswered) * 100)
                    : 0}%
                </span>
                <span className="ep-sv__q-stat-label">אחוז נכונות</span>
              </div>
            </div>
          </div>

          {/* טבלת תשובות שחקנים לשאלה זו */}
          <table className="ep-sv__table ep-sv__table--answers">
            <thead>
              <tr>
                <th>שחקן</th>
                <th>תשובה</th>
                <th>תוצאה</th>
                <th>זמן</th>
                <th>נקודות</th>
              </tr>
            </thead>
            <tbody>
              {session.players.map((player) => {
                const qIdx = session.questions.indexOf(selectedQuestion);
                const ans = player.answers.find(a => a.questionIndex === qIdx);
                return (
                  <tr key={player.nickname}>
                    <td>
                      <div className="ep-sv__player-cell">
                        <span className="ep-sv__avatar ep-sv__avatar--sm">
                          {player.nickname.charAt(0)}
                        </span>
                        <span className="ep-sv__player-name">{player.nickname}</span>
                      </div>
                    </td>
                    <td>
                      {ans ? (
                        <span className="ep-sv__answered-text">{ans.answered}</span>
                      ) : (
                        <span className="ep-sv__no-answer">לא ענה</span>
                      )}
                    </td>
                    <td>
                      {ans ? (
                        <span className={"ep-sv__result" + (ans.isCorrect ? " is-correct" : " is-wrong")}>
                          {ans.isCorrect ? "✓ נכון" : "✕ שגוי"}
                        </span>
                      ) : (
                        <span className="ep-sv__result is-neutral">—</span>
                      )}
                    </td>
                    <td>
                      <span className="ep-sv__time-val">
                        {ans ? `${ans.timeToAnswer}s` : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="ep-sv__pts-val">
                        {ans ? ans.pointsEarned : 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}