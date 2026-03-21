import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart,
  Bar, Cell
} from "recharts";
import CircularProgress from "@mui/material/CircularProgress";
import "./Statistics.css";

const API = "http://localhost:5000";

/* ─── Custom Tooltip ──────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(6,13,26,0.95)",
      border: "1px solid rgba(0,200,255,0.25)",
      borderRadius: 12,
      padding: "10px 14px",
      fontSize: 13,
      color: "#fff"
    }}>
      <div style={{ color: "rgba(232,240,254,0.5)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: "#00c8ff" }}>{payload[0].value} משחקים</div>
    </div>
  );
};

/* ─── Bar Tooltip ─────────────────────────────────── */
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(6,13,26,0.95)",
      border: "1px solid rgba(0,200,255,0.25)",
      borderRadius: 12,
      padding: "10px 14px",
      fontSize: 13,
      color: "#fff"
    }}>
      <div style={{ color: "rgba(232,240,254,0.5)", marginBottom: 4, maxWidth: 160 }}>{label}</div>
      <div style={{ fontWeight: 700, color: "#00c8ff" }}>{payload[0].value}% נכון</div>
    </div>
  );
};

/* ─── Tab: Personal ──────────────────────────────── */
function PersonalTab({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/stats/user`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="stats-loading"><CircularProgress sx={{ color: "#00c8ff" }} /></div>;
  if (!data) return <div className="stats-empty">שגיאה בטעינת נתונים</div>;

  const cards = [
    { icon: "🎯", label: "חידונים שנוצרו", value: data.totalQuizzes, accent: "linear-gradient(90deg,#00c8ff,#7846ff)" },
    { icon: "🎮", label: "משחקים שהתקיימו", value: data.totalSessions, accent: "linear-gradient(90deg,#f97316,#ef4444)" },
    { icon: "👥", label: "שחקנים שהשתתפו", value: data.totalPlayers, accent: "linear-gradient(90deg,#34d399,#059669)" },
    { icon: "📊", label: "ממוצע שחקנים", value: data.avgPlayersPerSession, accent: "linear-gradient(90deg,#a78bfa,#7c3aed)" },
  ];

  return (
    <>
      <div className="stats-grid">
        {cards.map((c, i) => (
          <div className="stat-card" key={i} style={{ "--card-accent": c.accent }}>
            <div className="stat-card-icon">{c.icon}</div>
            <div className="stat-card-label">{c.label}</div>
            <div className="stat-card-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="chart-card">
        <div className="chart-card-title">פעילות לאורך זמן</div>
        {data.activityChart?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.activityChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00c8ff"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#00c8ff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="stats-empty">עדיין אין נתוני פעילות</div>
        )}
      </div>

      {data.recentSessions?.length > 0 && (
        <div className="chart-card">
          <div className="chart-card-title">משחקים אחרונים</div>
          <table className="sessions-table">
            <thead>
              <tr>
                <th>חידון</th>
                <th>שחקנים</th>
                <th>תאריך</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSessions.map((s, i) => (
                <tr key={i}>
                  <td>{s.quizTitle}</td>
                  <td>{s.totalPlayers}</td>
                  <td>{new Date(s.playedAt).toLocaleDateString("he-IL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ─── Tab: Per Quiz ──────────────────────────────── */
function QuizTab({ token }) {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/quizzes/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        setQuizzes(r.data);
        if (r.data.length > 0) setSelectedId(r.data[0]._id);
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setData(null);
    axios.get(`${API}/stats/quiz/${selectedId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedId, token]);

  if (!quizzes.length) return <div className="stats-empty">עדיין לא יצרת חידונים</div>;

  const getBarColor = (pct) => {
    if (pct < 40) return ["#ff5050", "#ef4444"];
    if (pct < 70) return ["#f97316", "#fb923c"];
    return ["#34d399", "#059669"];
  };

  return (
    <>
      <div className="quiz-selector">
        {quizzes.map(q => (
          <button
            key={q._id}
            className={`quiz-pill ${selectedId === q._id ? "active" : ""}`}
            onClick={() => setSelectedId(q._id)}
          >
            {q.title}
          </button>
        ))}
      </div>

      {loading && <div className="stats-loading"><CircularProgress sx={{ color: "#00c8ff" }} size={36} /></div>}

      {data && !loading && (
        <>
          {data.message ? (
            <div className="stats-empty">🎯 {data.message}</div>
          ) : (
            <>
              <div className="stats-grid">
                {[
                  { icon: "🎮", label: "פעמים שהופעל", value: data.totalSessions, accent: "linear-gradient(90deg,#00c8ff,#7846ff)" },
                  { icon: "👥", label: "סה\"כ שחקנים", value: data.totalPlayers, accent: "linear-gradient(90deg,#34d399,#059669)" },
                  { icon: "⭐", label: "ממוצע ניקוד", value: data.avgScore, accent: "linear-gradient(90deg,#f97316,#ef4444)" },
                ].map((c, i) => (
                  <div className="stat-card" key={i} style={{ "--card-accent": c.accent }}>
                    <div className="stat-card-icon">{c.icon}</div>
                    <div className="stat-card-label">{c.label}</div>
                    <div className="stat-card-value">{c.value}</div>
                  </div>
                ))}
              </div>

              {data.hardest && data.easiest && (
                <div className="highlight-row">
                  <div className="highlight-card hard">
                    <div className="highlight-icon">🔴</div>
                    <div className="highlight-info">
                      <span className="label">הכי קשה</span>
                      <span className="value">{data.hardest.question}</span>
                      <span className="pct">{data.hardest.percent}% ענו נכון</span>
                    </div>
                  </div>
                  <div className="highlight-card easy">
                    <div className="highlight-icon">🟢</div>
                    <div className="highlight-info">
                      <span className="label">הכי קלה</span>
                      <span className="value">{data.easiest.question}</span>
                      <span className="pct">{data.easiest.percent}% ענו נכון</span>
                    </div>
                  </div>
                </div>
              )}

              {data.questionChart?.length > 0 && (
                <div className="chart-card">
                  <div className="chart-card-title">אחוז נכון לכל שאלה</div>
                  <ResponsiveContainer width="100%" height={Math.max(200, data.questionChart.length * 45)}>
                    <BarChart
                      data={data.questionChart}
                      layout="vertical"
                      margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="question" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip content={<BarTooltip />} />
                      <Bar dataKey="percent" radius={[0, 8, 8, 0]}>
                        {data.questionChart.map((entry, i) => {
                          const [start, end] = getBarColor(entry.percent);
                          return <Cell key={i} fill={start} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

/* ─── Tab: Sessions ──────────────────────────────── */
function SessionsTab({ token }) {
  const [sessions, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // טוען sessions דרך user stats
    axios.get(`${API}/stats/user`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        setData(r.data.recentSessions || []);
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSession = (id) => {
    setSelected(id);
    setDetailLoading(true);
    axios.get(`${API}/stats/session/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setSessionDetail(r.data))
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  };

  if (sessions === true) return <div className="stats-loading"><CircularProgress sx={{ color: "#00c8ff" }} size={36} /></div>;

  if (!data.length) return <div className="stats-empty">עדיין לא היו משחקים</div>;

  return (
    <div className="stats-row" style={{ alignItems: "flex-start" }}>
      {/* רשימה */}
      <div className="chart-card" style={{ marginBottom: 0 }}>
        <div className="chart-card-title">משחקים אחרונים</div>
        <table className="sessions-table">
          <thead>
            <tr>
              <th>חידון</th>
              <th>שחקנים</th>
              <th>תאריך</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <tr
                key={i}
                onClick={() => loadSession(s.id)}
                style={{ cursor: "pointer", background: selected === s.id ? "rgba(0,200,255,0.07)" : undefined }}
              >
                <td>{s.quizTitle}</td>
                <td>{s.totalPlayers}</td>
                <td>{new Date(s.playedAt).toLocaleDateString("he-IL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* פרטי session */}
      <div className="chart-card" style={{ marginBottom: 0 }}>
        {detailLoading && <div className="stats-loading"><CircularProgress sx={{ color: "#00c8ff" }} size={28} /></div>}

        {!selected && !detailLoading && (
          <div className="stats-empty" style={{ padding: "30px 0" }}>בחר משחק לצפייה בפרטים</div>
        )}

        {sessionDetail && !detailLoading && (
          <>
            <div className="chart-card-title">תוצאות — {sessionDetail.quizTitle}</div>
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>מקום</th>
                  <th>שחקן</th>
                  <th>ניקוד</th>
                </tr>
              </thead>
              <tbody>
                {sessionDetail.players.map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: i === 0 ? "#fbbf24" : i === 1 ? "#9ca3af" : i === 2 ? "#b45309" : "inherit" }}>
                      {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td>{p.nickname}</td>
                    <td style={{ fontWeight: 700, color: "#00c8ff" }}>{p.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sessionDetail.questionStats?.length > 0 && (
              <>
                <div className="chart-card-title" style={{ marginTop: 24 }}>ביצועי שאלות</div>
                <div className="bar-chart">
                  {sessionDetail.questionStats.map((q, i) => {
                    const pct = q.correctPercent;
                    const start = pct < 40 ? "#ff5050" : pct < 70 ? "#f97316" : "#34d399";
                    const end = pct < 40 ? "#ef4444" : pct < 70 ? "#fb923c" : "#059669";
                    return (
                      <div key={i} className="bar-row">
                        <div className="bar-label">{q.questionText?.slice(0, 35)}{q.questionText?.length > 35 ? "…" : ""}</div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${pct}%`,
                              "--bar-color-start": start,
                              "--bar-color-end": end
                            }}
                          />
                        </div>
                        <div className="bar-pct">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Tab: Global ────────────────────────────────── */
function GlobalTab({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/stats/global`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="stats-loading"><CircularProgress sx={{ color: "#00c8ff" }} /></div>;
  if (!data) return <div className="stats-empty">שגיאה בטעינת נתונים</div>;

  return (
    <>
      <div className="global-grid">
        {[
          { icon: "👤", label: "משתמשים רשומים", value: data.totalUsers, accent: "linear-gradient(90deg,#00c8ff,#7846ff)" },
          { icon: "📚", label: "חידונים במערכת", value: data.totalQuizzes, accent: "linear-gradient(90deg,#a78bfa,#7c3aed)" },
          { icon: "🎮", label: "משחקים שהתקיימו", value: data.totalSessions, accent: "linear-gradient(90deg,#f97316,#ef4444)" },
          { icon: "🏃", label: "סה\"כ שחקנים", value: data.totalPlayersEver, accent: "linear-gradient(90deg,#34d399,#059669)" },
        ].map((c, i) => (
          <div className="stat-card" key={i} style={{ "--card-accent": c.accent }}>
            <div className="stat-card-icon">{c.icon}</div>
            <div className="stat-card-label">{c.label}</div>
            <div className="stat-card-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="stats-row">
        {/* פעילות חודשית */}
        <div className="chart-card" style={{ marginBottom: 0 }}>
          <div className="chart-card-title">פעילות חודשית</div>
          {data.activityChart?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.activityChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#00c8ff" opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="stats-empty">אין נתוני פעילות</div>
          )}
        </div>

        {/* חידונים פופולריים */}
        <div className="chart-card" style={{ marginBottom: 0 }}>
          <div className="chart-card-title">חידונים פופולריים</div>
          {data.popularQuizzes?.length > 0 ? (
            <div>
              {data.popularQuizzes.map((q, i) => (
                <div key={i} className="popular-item">
                  <div className="popular-rank">#{i + 1}</div>
                  <div className="popular-title">{q.title || "חידון ללא שם"}</div>
                  <div className="popular-count">{q.count} משחקים</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stats-empty">אין נתונים עדיין</div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ─────────────────────────────── */
export default function Statistics() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");

  const tabs = [
    { id: "personal", label: "📈 שלי" },
    { id: "quiz", label: "📋 לפי חידון" },
    { id: "sessions", label: "🎮 משחקים" },
    { id: "global", label: "🌍 גלובלי" },
  ];

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>סטטיסטיקות</h1>
      </div>

      <div className="stats-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`stats-tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "personal" && <PersonalTab token={token} />}
      {activeTab === "quiz" && <QuizTab token={token} />}
      {activeTab === "sessions" && <SessionsTab token={token} />}
      {activeTab === "global" && <GlobalTab token={token} />}
    </div>
  );
}