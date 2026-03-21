import { useState, useEffect, useRef } from "react";
import { getSocket } from "../../socket";
import "./CreateRoom.css";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function CreateRoom() {
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const socket = getSocket();

  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("quizId");

  const roomCreated = useRef(false);

  useEffect(() => {
    // יצירת חדר
    if (!roomCreated.current) {
      socket.emit("createRoom", { quizId });
      roomCreated.current = true; // מסמן שכבר שלחנו emit
    }

    const handleRoomUpdated = (roomData) => {
      setRoom(roomData);

      // אם החידון התחיל – עוברים למסך המארח
      if (roomData.phase === "QUESTION") {
        navigate(`/host/game?roomId=${roomData.roomId}`);
      }
    };

    socket.on("roomUpdated", handleRoomUpdated);

    return () => {
      socket.off("roomUpdated", handleRoomUpdated);
    };
  }, [quizId, navigate, socket]);

  const startGame = () => {
    if (!room) return;
    socket.emit("startQuiz", { roomId: room.roomId });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // הגדלתי קצת את זמן ההודעה כדי שיהיה קריא
  };

  /* ==========================
     Loading State
  ========================== */
  if (!room) {
    return (
      <div className="create-room-wrapper">
        <div className="glass-panel text-center loading-panel">
          <div className="loader"></div>
          <h2 className="title-glow">מכין את החדר...</h2>
        </div>
      </div>
    );
  }

  /* ==========================
     Lobby UI (Host)
  ========================== */
  return (
    <div className="create-room-wrapper">
      <div className="glass-panel host-lobby-panel">
        
        <div className="header-section">
          <h1 className="title-glow">החדר מוכן! 🎮</h1>
          <p className="subtitle">בקשו מהשחקנים להיכנס ולהזין את הקוד:</p>
        </div>

        {/* Room Code Display */}
        <div 
          className={`room-code-box ${copied ? "copied" : ""}`} 
          onClick={copyRoomCode}
          title="לחץ להעתקה"
        >
          <span className="room-code-text">{room.roomId}</span>
          <div className="copy-hint">
            {copied ? "הועתק! ✔️" : "לחץ להעתקה 📋"}
          </div>
        </div>

        {/* Players Section */}
        <div className="players-section">
          <div className="players-header">
            <h3>שחקנים בחדר</h3>
            <span className="players-count-badge">{room.players.length}</span>
          </div>

          {room.players.length === 0 ? (
            <div className="empty-state pulse-text">
              ⏳ ממתין לשחקנים שיצטרפו...
            </div>
          ) : (
            <div className="host-players-grid-container">
              <ul className="host-players-grid">
                {room.players.map((p, i) => (
                  <li 
                    key={p.userId || i} 
                    className="host-player-card"
                    style={{ animationDelay: `${(i % 10) * 0.1}s` }}
                  >
                    <div className="player-avatar">{p.nickname.charAt(0)}</div>
                    <span className="player-name">{p.nickname}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Section */}
        <div className="action-section">
          <button
            className={`start-game-btn ${room.players.length > 0 ? "ready pulse-glow" : ""}`}
            onClick={startGame}
            disabled={room.players.length === 0}
          >
            <span className="btn-icon">▶</span> התחל משחק
          </button>
          
          {room.players.length === 0 && (
            <p className="warning-text">
              ❌ לא ניתן להתחיל משחק ללא שחקנים
            </p>
          )}
        </div>

      </div>
    </div>
  );
}