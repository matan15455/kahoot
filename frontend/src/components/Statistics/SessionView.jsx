import { useState, useEffect, useMemo } from "react";
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
  const [tab, setTab] = useState("overview"); // overview | players | questions
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

  /* חישובים */
  const computed = useMemo(() => {
    if (!session) return null;

    const sorted = [...session.players].sort((a, b) => b.score - a.score);

    // התפלגות תשובות לכל שאלה — לפי טקסט התשובה
    // וגם זיהוי התשובה הנכונה (לוקח את אחת ה-isCorrect)
    const questionInsights = session.questions.map((q, qIdx) => {
      const counts = {}; // answeredText → count
      let correctAnswerText = null;

      session.players.forEach((p) => {
        const ans = p.answers.find((a) => a.questionIndex === qIdx);
        if (!ans) return;
        counts[ans.answered] = (counts[ans.answered] || 0) + 1;
        if (ans.isCorrect && !correctAnswerText) {
          correctAnswerText = ans.answered;
        }
      });

      // ממוצע זמן (רק מי שענה)
      const times = [];
      session.players.forEach((p) => {
        const ans = p.answers.find((a) => a.questionIndex === qIdx);
        if (ans && typeof ans.timeToAnswer === "number") times.push(ans.timeToAnswer);
      });
      const avgTime = times.length > 0
        ? Math.round((times.reduce((s, t) => s + t, 0) / times.length) * 10) / 10
        : null;

      const correctPct = q.totalAnswered > 0
        ? Math.round((q.totalCorrect / q.totalAnswered) * 100)
        : 0;

      return {
        index: qIdx,
        question: q,
        counts,
        correctAnswerText,
        avgTime,
        correctPct,
      };
    });

    // הכי קשה / הכי קלה
    const sortedByDifficulty = [...questionInsights]
      .filter((q) => q.question.totalAnswered > 0)
      .sort((a, b) => a.correctPct - b.correctPct);
    const hardest = sortedByDifficulty[0] || null;
    const easiest = sortedByDifficulty[sortedByDifficulty.length - 1] || null;

    // ממוצע זמן כללי
    const allTimes = session.players.flatMap((p) =>
      p.answers.filter((a) => typeof a.timeToAnswer === "number").map((a) => a.timeToAnswer)
    );
    const avgTimeAll = allTimes.length > 0
      ? Math.round((allTimes.reduce((s, t) => s + t, 0) / allTimes.length) * 10) / 10
      : null;

    // ממוצע ניקוד
    const avgScore = sorted.length > 0
      ? Math.round(sorted.reduce((s, p) => s + p.score, 0) / sorted.length)
      : 0;

    // אחוז נכונות כולל
    const totalCorrect = session.questions.reduce((s, q) => s + q.totalCorrect, 0);
    const totalAnsweredAll = session.questions.reduce((s, q) => s + q.totalAnswered, 0);
    const overallCorrectPct = totalAnsweredAll > 0
      ? Math.round((totalCorrect / totalAnsweredAll) * 100)
      : 0;

    return { sorted, questionInsights, hardest, easiest, avgTimeAll, avgScore, overallCorrectPct };
  }, [session]);

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

  const { sorted, questionInsights, hardest, easiest, avgTimeAll, avgScore, overallCorrectPct } = computed;

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
          חזרה
        </button>
        <div className="ep-sv__head-body">
          <p className="ep-sv__kicker">דוח משחק · {dateStr} · {timeStr}</p>
          <h1 className="ep-sv__title">{session.quizTitle}</h1>
        </div>
        <div className="ep-sv__meta-chips">
          <span className="ep-sv__meta-chip">{session.players.length} שחקנים</span>
          <span className="ep-sv__meta-chip"> {session.questions.length} שאלות</span>
          <span className="ep-sv__meta-chip">
            {overallCorrectPct}% נכונות
          </span>
        </div>
      </header>

      {/* ── טאבים ── */}
      <div className="ep-sv__tabs">
        <button
          className={"ep-sv__tab" + (tab === "overview" ? " is-active" : "")}
          onClick={() => { setTab("overview"); setSelectedPlayer(null); setSelectedQuestion(null); }}
        >
          סקירה
        </button>
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

      {/* ══ טאב סקירה ══ */}
      {tab === "overview" && (
        <div className="ep-sv__panel">
          {/* ── פודיום ── */}
          {sorted.length > 0 && (
            <div className="ep-sv__podium">
              {sorted[1] && (
                <div className="ep-sv__pod ep-sv__pod--2">
                  <div className="ep-sv__pod-rank">2</div>
                  <div className="ep-sv__pod-avatar">{sorted[1].nickname.charAt(0)}</div>
                  <div className="ep-sv__pod-name">{sorted[1].nickname}</div>
                  <div className="ep-sv__pod-score">{sorted[1].score.toLocaleString()}</div>
                  <div className="ep-sv__pod-block ep-sv__pod-block--2" />
                </div>
              )}
              {sorted[0] && (
                <div className="ep-sv__pod ep-sv__pod--1">
                  <div className="ep-sv__pod-crown">👑</div>
                  <div className="ep-sv__pod-avatar ep-sv__pod-avatar--gold">
                    {sorted[0].nickname.charAt(0)}
                  </div>
                  <div className="ep-sv__pod-name">{sorted[0].nickname}</div>
                  <div className="ep-sv__pod-score">{sorted[0].score.toLocaleString()}</div>
                  <div className="ep-sv__pod-block ep-sv__pod-block--1" />
                </div>
              )}
              {sorted[2] && (
                <div className="ep-sv__pod ep-sv__pod--3">
                  <div className="ep-sv__pod-rank">3</div>
                  <div className="ep-sv__pod-avatar">{sorted[2].nickname.charAt(0)}</div>
                  <div className="ep-sv__pod-name">{sorted[2].nickname}</div>
                  <div className="ep-sv__pod-score">{sorted[2].score.toLocaleString()}</div>
                  <div className="ep-sv__pod-block ep-sv__pod-block--3" />
                </div>
              )}
            </div>
          )}

          {/* ── 4 כרטיסי insight ── */}
          <div className="ep-sv__kpis">
            <div className="ep-sv__kpi">
              <span className="ep-sv__kpi-label">ממוצע ניקוד</span>
              <span className="ep-sv__kpi-val">{avgScore.toLocaleString()}</span>
              <span className="ep-sv__kpi-meta">{session.players.length} שחקנים</span>
            </div>
            <div className="ep-sv__kpi">
              <span className="ep-sv__kpi-label">אחוז נכונות כללי</span>
              <span className={
                "ep-sv__kpi-val " +
                (overallCorrectPct >= 70 ? "is-good"
                  : overallCorrectPct >= 40 ? "is-mid" : "is-low")
              }>{overallCorrectPct}%</span>
              <span className="ep-sv__kpi-meta">מתוך כל התשובות</span>
            </div>
            <div className="ep-sv__kpi">
              <span className="ep-sv__kpi-label">זמן ממוצע לתשובה</span>
              <span className="ep-sv__kpi-val">
                {avgTimeAll !== null ? `${avgTimeAll}s` : "—"}
              </span>
              <span className="ep-sv__kpi-meta">לכל השאלות</span>
            </div>
            <div className="ep-sv__kpi">
              <span className="ep-sv__kpi-label">ניקוד גבוה ביותר</span>
              <span className="ep-sv__kpi-val">
                {sorted[0]?.score.toLocaleString() ?? "—"}
              </span>
              <span className="ep-sv__kpi-meta">{sorted[0]?.nickname ?? "—"}</span>
            </div>
          </div>

          {/*  הכי קשה / הכי קלה  */}
          {hardest && easiest && hardest.index !== easiest.index && (
            <div className="ep-sv__hl-row">
              <button
                className="ep-sv__hl ep-sv__hl--hard"
                onClick={() => { setTab("questions"); setSelectedQuestion(hardest.question); }}
              >
                <div className="ep-sv__hl-head">
                  <span className="ep-sv__hl-icon">🔴</span>
                  <span className="ep-sv__hl-label">השאלה הכי קשה</span>
                </div>
                <p className="ep-sv__hl-text">{hardest.question.text}</p>
                <div className="ep-sv__hl-foot">
                  <span className="ep-sv__hl-pct">{hardest.correctPct}% ענו נכון</span>
                  <span className="ep-sv__hl-arrow">←</span>
                </div>
              </button>
              <button
                className="ep-sv__hl ep-sv__hl--easy"
                onClick={() => { setTab("questions"); setSelectedQuestion(easiest.question); }}
              >
                <div className="ep-sv__hl-head">
                  <span className="ep-sv__hl-icon">🟢</span>
                  <span className="ep-sv__hl-label">השאלה הכי קלה</span>
                </div>
                <p className="ep-sv__hl-text">{easiest.question.text}</p>
                <div className="ep-sv__hl-foot">
                  <span className="ep-sv__hl-pct">{easiest.correctPct}% ענו נכון</span>
                  <span className="ep-sv__hl-arrow">←</span>
                </div>
              </button>
            </div>
          )}

          {/* ── התקדמות לפי שאלה ── */}
          <div className="ep-sv__progress-card">
            <h3 className="ep-sv__panel-title">אחוז נכונות לפי שאלה</h3>
            <div className="ep-sv__progress-list">
              {questionInsights.map((qi) => (
                <button
                  key={qi.index}
                  className="ep-sv__progress-row"
                  onClick={() => { setTab("questions"); setSelectedQuestion(qi.question); }}
                >
                  <span className="ep-sv__progress-num">{qi.index + 1}</span>
                  <span className="ep-sv__progress-text">
                    {qi.question.text.length > 60
                      ? qi.question.text.slice(0, 60) + "…"
                      : qi.question.text}
                  </span>
                  <span className="ep-sv__progress-bar-wrap">
                    <span className="ep-sv__progress-bar">
                      <span
                        className={
                          "ep-sv__progress-fill " +
                          (qi.correctPct >= 70 ? "is-good"
                            : qi.correctPct >= 40 ? "is-mid" : "is-low")
                        }
                        style={{ width: qi.correctPct + "%" }}
                      />
                    </span>
                  </span>
                  <span className={
                    "ep-sv__progress-pct " +
                    (qi.correctPct >= 70 ? "is-good"
                      : qi.correctPct >= 40 ? "is-mid" : "is-low")
                  }>{qi.correctPct}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
                const pct = session.questions.length > 0
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
                        <span className="ep-sv__pct">
                          {correctCount}/{session.questions.length}
                          <span className="ep-sv__pct-sub"> · {pct}%</span>
                        </span>
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
                        <span>{correctCount}/{session.questions.length} נכון</span>
                        <span>·</span>
                        <span>{pct}%</span>
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
                <th>התשובה שלו</th>
                <th>תוצאה</th>
                <th>זמן</th>
                <th>נקודות</th>
              </tr>
            </thead>
            <tbody>
              {session.questions.map((q, idx) => {
                const ans = selectedPlayer.answers.find(a => a.questionIndex === idx);
                const qi = questionInsights[idx];
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
                        <div className="ep-sv__ans-cell">
                          <span className={
                            "ep-sv__answered-text" + (ans.isCorrect ? "" : " is-wrong")
                          }>
                            {ans.answered}
                          </span>
                          {!ans.isCorrect && qi.correctAnswerText && (
                            <span className="ep-sv__correct-hint">
                              נכון: <strong>{qi.correctAnswerText}</strong>
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="ep-sv__ans-cell">
                          <span className="ep-sv__no-answer">לא ענה</span>
                          {qi.correctAnswerText && (
                            <span className="ep-sv__correct-hint">
                              נכון: <strong>{qi.correctAnswerText}</strong>
                            </span>
                          )}
                        </div>
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
                <th>זמן ממוצע</th>
                <th>נכונות</th>
              </tr>
            </thead>
            <tbody>
              {questionInsights.map((qi) => {
                const pct = qi.correctPct;
                return (
                  <tr
                    key={qi.index}
                    className="ep-sv__tr--clickable"
                    onClick={() => setSelectedQuestion(qi.question)}
                  >
                    <td><span className="ep-sv__q-num">{qi.index + 1}</span></td>
                    <td className="ep-sv__q-text-cell">
                      {qi.question.text.length > 65 ? qi.question.text.slice(0, 65) + "…" : qi.question.text}
                    </td>
                    <td>
                      <span className="ep-sv__time-val">
                        {qi.avgTime !== null ? `${qi.avgTime}s` : "—"}
                      </span>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ פרטי שאלה ══ */}
      {tab === "questions" && selectedQuestion && (() => {
        const qIdx = session.questions.indexOf(selectedQuestion);
        const qi = questionInsights[qIdx];
        const totalAns = selectedQuestion.totalAnswered;
        // מיין אופציות לפי כמות
        const distEntries = Object.entries(qi.counts)
          .sort((a, b) => b[1] - a[1]);
        const maxCount = Math.max(...Object.values(qi.counts), 1);

        return (
          <div className="ep-sv__panel">
            <button
              className="ep-sv__back-inner"
              onClick={() => setSelectedQuestion(null)}
            >
              ← כל השאלות
            </button>

            <div className="ep-sv__q-hero">
              <span className="ep-sv__q-hero-num">
                שאלה {qIdx + 1}
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
                  <span className="ep-sv__q-stat-val">{qi.correctPct}%</span>
                  <span className="ep-sv__q-stat-label">נכונות</span>
                </div>
                <div className="ep-sv__q-stat">
                  <span className="ep-sv__q-stat-val">
                    {qi.avgTime !== null ? `${qi.avgTime}s` : "—"}
                  </span>
                  <span className="ep-sv__q-stat-label">זמן ממוצע</span>
                </div>
              </div>
            </div>

            {/* ── התפלגות תשובות (גרף) ── */}
            {distEntries.length > 0 && (
              <div className="ep-sv__dist-card">
                <h3 className="ep-sv__panel-title">איך הצביעו השחקנים</h3>
                <ul className="ep-sv__dist">
                  {distEntries.map(([text, count], i) => {
                    const meta = ANSWER_META[i % ANSWER_META.length];
                    const isCorrect = text === qi.correctAnswerText;
                    const pct = totalAns > 0 ? Math.round((count / totalAns) * 100) : 0;
                    const widthPct = (count / maxCount) * 100;
                    return (
                      <li key={text} className={"ep-sv__dist-row" + (isCorrect ? " is-correct" : "")}>
                        <span
                          className="ep-sv__dist-tag"
                          style={{ background: meta.color, color: meta.textOn }}
                        >
                          {meta.letter}
                        </span>
                        <div className="ep-sv__dist-body">
                          <div className="ep-sv__dist-head">
                            <span className="ep-sv__dist-text">
                              {text}
                              {isCorrect && (
                                <span className="ep-sv__dist-correct-tag">✓ נכון</span>
                              )}
                            </span>
                            <span className="ep-sv__dist-count">
                              {count}
                              <span className="ep-sv__dist-pct"> · {pct}%</span>
                            </span>
                          </div>
                          <div className="ep-sv__dist-bar">
                            <i
                              style={{
                                width: widthPct + "%",
                                background: meta.color
                              }}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* טבלת תשובות שחקנים לשאלה זו */}
            <h3 className="ep-sv__panel-title">תשובה לכל שחקן</h3>
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
        );
      })()}
    </div>
  );
}
