import "./ScoreTable.css";

export default function ScoreTable({ players = [] }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">🏆 ניקוד 🏆</h1>

      <div className="podium">

        {top3[1] && (
          <div className="podium-card second">
            <div className="podium-rank">🥈</div>
            <div className="podium-name">{top3[1].nickname}</div>
            <div className="podium-score">{top3[1].score}</div>
          </div>
        )}

        {top3[0] && (
          <div className="podium-card first">
            <div className="podium-rank crown">👑</div>
            <div className="podium-name">{top3[0].nickname}</div>
            <div className="podium-score">{top3[0].score}</div>
          </div>
        )}

        {top3[2] && (
          <div className="podium-card third">
            <div className="podium-rank">🥉</div>
            <div className="podium-name">{top3[2].nickname}</div>
            <div className="podium-score">{top3[2].score}</div>
          </div>
        )}

      </div>

      <div className="leaderboard-list">
        {rest.map((p, i) => (
          <div key={p.userId || i} className="leaderboard-row">
            <span className="rank">#{i + 4}</span>
            <span className="player">{p.nickname}</span>
            <span className="score">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}