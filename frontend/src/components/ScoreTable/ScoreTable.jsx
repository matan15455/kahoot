import "./ScoreTable.css";

export default function ScoreTable({ players = [] }) {
  // מיון שחקנים לפי ניקוד (מהגבוה לנמוך)
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="leaderboard-container">
      
      {/* פודיום למקומות 1-3 */}
      <div className="podium-area">
        {/* מקום 2 */}
        {top3[1] && (
          <div className="podium-item place-2">
            <div className="player-avatar silver-glow">
              {top3[1].nickname.charAt(0)}
            </div>
            <div className="player-name">{top3[1].nickname}</div>
            <div className="podium-pillar pillar-2">
              <span className="podium-score">{top3[1].score}</span>
              <span className="podium-rank">🥈</span>
            </div>
          </div>
        )}

        {/* מקום 1 */}
        {top3[0] && (
          <div className="podium-item place-1">
            <div className="crown-icon">👑</div>
            <div className="player-avatar gold-glow">
              {top3[0].nickname.charAt(0)}
            </div>
            <div className="player-name winner-name">{top3[0].nickname}</div>
            <div className="podium-pillar pillar-1">
              <span className="podium-score">{top3[0].score}</span>
              <span className="podium-rank">1</span>
            </div>
          </div>
        )}

        {/* מקום 3 */}
        {top3[2] && (
          <div className="podium-item place-3">
            <div className="player-avatar bronze-glow">
              {top3[2].nickname.charAt(0)}
            </div>
            <div className="player-name">{top3[2].nickname}</div>
            <div className="podium-pillar pillar-3">
              <span className="podium-score">{top3[2].score}</span>
              <span className="podium-rank">🥉</span>
            </div>
          </div>
        )}
      </div>

      {/* רשימת שאר השחקנים (מקום 4 והלאה) */}
      {rest.length > 0 && (
        <div className="leaderboard-list">
          {rest.map((p, i) => (
            <div 
              key={p.userId || i} 
              className="list-row"
              style={{ animationDelay: `${i * 0.1}s` }} // מרווח אנימציה לכל שורה
            >
              <div className="row-rank">#{i + 4}</div>
              <div className="row-avatar">{p.nickname.charAt(0)}</div>
              <div className="row-name">{p.nickname}</div>
              <div className="row-score">{p.score}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}