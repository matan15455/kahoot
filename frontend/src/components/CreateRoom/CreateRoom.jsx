import { useState, useEffect, useRef } from "react";
import { getSocket } from "../../socket";
import { useSearchParams, useNavigate } from "react-router-dom";
import { EpShape } from "../_shared/EpBrand";
import "./CreateRoom.css";

export default function CreateRoom() {
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(null); // 'pin' | 'link' | null

  const navigate = useNavigate();
  // מקבל את החיבור
  const socket = getSocket();

  const [searchParams] = useSearchParams();
  // שולף את מזהה החידון מהכתובת
  const quizId = searchParams.get("quizId");

  const roomCreated = useRef(false);
  const gameStartingRef = useRef(false);
  const roomIdRef = useRef(null);


  useEffect(() => {
    // יצירת חדר
    if (!roomCreated.current) {
      socket.emit("createRoom", { quizId });
      roomCreated.current = true; // מסמן שכבר שלחנו emit
    }

    // מעדכן את הממשק לאחר קבלת עדכון על שינוי חדר
    const handleRoomUpdated = (roomData) => {
      setRoom(roomData);
      roomIdRef.current = roomData.roomId;

      // אם החידון התחיל עוברים למסך המארח
      if (roomData.phase === "QUESTION") {
        gameStartingRef.current = true;
        navigate(`/host/game?roomId=${roomData.roomId}`);
      }
    };

    socket.on("roomUpdated", handleRoomUpdated);
    

    return () => {
      socket.off("roomUpdated", handleRoomUpdated);
      if (!gameStartingRef.current && roomIdRef.current) {
        socket.emit("leaveRoom", { roomId: roomIdRef.current });
      }
    };
  }, [quizId, navigate]);


  // מתחיל את המשחק כשלוחצים על התחל
  const startGame = () => {
    if (!room)
      return;
    socket.emit("startQuiz", { roomId: room.roomId });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.roomId);
    setCopied("pin");
    setTimeout(() => setCopied(null), 1500);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/join-room?roomId=${room.roomId}`;
    navigator.clipboard.writeText(url);
    setCopied("link");
    setTimeout(() => setCopied(null), 1500);
  };

  /* ============ Loading ============ */
  if (!room) {
    return (
      <div className="ep-cr ep-cr--state">
        <div className="ep-cr__loader">
          <div className="ep-cr__spinner" />
          <p className="ep-cr__loader-text">יוצר חדר…</p>
        </div>
      </div>
    );
  }

  const playerCount = room.players.length;
  const pinDigits = room.roomId.split("");

  return (
    <div className="ep-cr">
      <div className="ep-cr__grid">

        {/* ============ צד שמאל: PIN ו-CTA ============ */}
        <section className="ep-cr__main">
          <div className="ep-cr__main-head">
            <span className="ep-cr__kicker">
              <span className="ep-cr__kicker-dot" />
              חדר פעיל
            </span>
            <h1 className="ep-cr__title">החדר נוצר</h1>
            <p className="ep-cr__sub">
שתף את הקוד המשחק יתחיל כשתלחץ על התחל משחק.
            </p>
          </div>

          <div className="ep-cr__pin-wrap">
            <div className="ep-cr__pin">
              {pinDigits.map((d, i) => (
                <span key={i} className="ep-cr__pin-digit">{d}</span>
              ))}
            </div>
          </div>

          <div className="ep-cr__actions">
            <button
              className={"ep-cr__act" + (copied === "pin" ? " is-copied" : "")}
              onClick={copyRoomCode}
            >
              {copied === "pin" ? "✓ הועתק" : "העתק קוד"}
            </button>
          </div>

          <button
            className="ep-cr__start"
            onClick={startGame}
            disabled={playerCount === 0}
          >
            <span className="ep-cr__start-icon" aria-hidden="true">▶</span>
            <span>התחל משחק</span>
            {playerCount > 0 && (
              <span className="ep-cr__start-meta">· {playerCount} שחקנים</span>
            )}
          </button>

          {playerCount === 0 && (
            <p className="ep-cr__hint">
              <span className="ep-cr__hint-icon">!</span>
              לא ניתן להתחיל משחק בלי שחקנים חכה שמישהו יצטרף.
            </p>
          )}
        </section>

        {/* ============ צד ימין: שחקנים ============ */}
        <aside className="ep-cr__roster">
          <div className="ep-cr__roster-head">
            <p className="ep-cr__roster-label">שחקנים בחדר</p>
            <p className="ep-cr__roster-count">{playerCount}</p>
            <div className="ep-cr__roster-status">
              <span className="ep-cr__pulse" />
              ממתין לעוד מצטרפים…
            </div>
          </div>

          {playerCount === 0 ? (
            <div className="ep-cr__roster-empty">
              <span className="ep-cr__empty-glyph" aria-hidden="true">
                <EpShape kind="hex" size={40} color="rgba(255,255,255,0.18)" />
              </span>
              <p>החדר ריק כרגע.<br />שתף את הקוד עם שחקנים.</p>
            </div>
          ) : (
            <ul className="ep-cr__players">
              {room.players.map((p, i) => (
                <li key={p.userId || p.socketId || i} className="ep-cr__player">
                  <span className="ep-cr__avatar">{p.nickname.charAt(0)}</span>
                  <span className="ep-cr__player-name">{p.nickname}</span>
                  <button
                    className="ep-cr__kick"
                    onClick={() => {
                      if (!window.confirm(`להסיר את ${p.nickname}?`)) return;
                      socket.emit("kickPlayer", { roomId: room.roomId, nickname: p.nickname });
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
