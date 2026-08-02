import "./ScoreTable.css";

export default function ScoreTable({ players = [] }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="ep-st">
      {/*  פודיום  */}
      <div className="ep-st__podium">
        {top3[1] && (
          <div className="ep-st__pod ep-st__pod--2">
            <div className="ep-st__pod-medal" aria-hidden="true">2</div>
            <div className="ep-st__pod-avatar">{top3[1].nickname.charAt(0)}</div>
            <div className="ep-st__pod-name">{top3[1].nickname}</div>
            <div className="ep-st__pod-score">
              {top3[1].score?.toLocaleString?.() ?? top3[1].score}
              <span className="ep-st__pod-pts">נק'</span>
            </div>
            <div className="ep-st__pod-block ep-st__pod-block--2">2</div>
          </div>
        )}

        {top3[0] && (
          <div className="ep-st__pod ep-st__pod--1">
            <div className="ep-st__pod-crown" aria-hidden="true">👑</div>
            <div className="ep-st__pod-avatar ep-st__pod-avatar--gold">{top3[0].nickname.charAt(0)}</div>
            <div className="ep-st__pod-name">{top3[0].nickname}</div>
            <div className="ep-st__pod-score">
              {top3[0].score?.toLocaleString?.() ?? top3[0].score}
              <span className="ep-st__pod-pts">נק'</span>
            </div>
            <div className="ep-st__pod-block ep-st__pod-block--1">1</div>
          </div>
        )}

        {top3[2] && (
          <div className="ep-st__pod ep-st__pod--3">
            <div className="ep-st__pod-medal" aria-hidden="true">3</div>
            <div className="ep-st__pod-avatar">{top3[2].nickname.charAt(0)}</div>
            <div className="ep-st__pod-name">{top3[2].nickname}</div>
            <div className="ep-st__pod-score">
              {top3[2].score?.toLocaleString?.() ?? top3[2].score}
              <span className="ep-st__pod-pts">נק'</span>
            </div>
            <div className="ep-st__pod-block ep-st__pod-block--3">3</div>
          </div>
        )}
      </div>

      {/*  שאר השחקנים  */}
      {rest.length > 0 && (
        <ul className="ep-st__list">
          {rest.map((p, i) => (
            <li key={p.userId || p.socketId || i} className="ep-st__row">
              <span className="ep-st__row-rank">{i + 4}</span>
              <span className="ep-st__row-avatar">{p.nickname.charAt(0)}</span>
              <span className="ep-st__row-name">{p.nickname}</span>
              <span className="ep-st__row-score">
                {p.score?.toLocaleString?.() ?? p.score}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
