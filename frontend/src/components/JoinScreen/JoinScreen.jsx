import { useState, useEffect } from "react";
import { getSocket, connectSocket } from "../../socket";
import "./JoinScreen.css";
import { useNavigate } from "react-router-dom";

export default function JoinScreen() {
  const [socket, setSocket] = useState(null);
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let s = getSocket();

    if (!s) {
      s = connectSocket();   // אורח בלי token
    }

    setSocket(s);
  }, []);

  useEffect(() => {
    if (!socket) return;   

    const handleRoomUpdated = (roomData) => {
      if (roomData.roomId !== roomId) return;

      setRoom(roomData);

      if (roomData.phase === "QUESTION") {
        navigate(`/player/game?roomId=${roomData.roomId}`);
      }
    };

    socket.on("roomUpdated", handleRoomUpdated);

    return () => {
      socket.off("roomUpdated", handleRoomUpdated);
    };
  }, [socket, roomId, navigate]);  

  /* ==========================
     Join
  ========================== */
  const handleJoin = () => {
    if (!socket) return;  

    if (!nickname.trim() || !roomId.trim()) {
      setError("אנא מלא שם וקוד חדר");
      return;
    }

    setError("");
    
    socket.emit("joinRoom", { roomId, nickname }, (res) => {
      if (!res.ok) {
        setError(res.message);
      }
    });
  };

  /* ==========================
     Waiting Room UI
  ========================== */
  if (room) {
    return (
      <div className="join-wrapper">
        <div className="glass-panel text-center lobby-panel">
          <h1 className="title-glow success-text">אתה בפנים! 🎉</h1>
          
          <div className="players-counter">
            👥 שחקנים בחדר: <span className="counter-number">{room.players.length}</span>
          </div>

          <div className="players-grid-container">
            <ul className="players-grid">
              {room.players.map((p, i) => (
                <li 
                  key={p.socketId} 
                  className="player-card"
                  style={{ animationDelay: `${(i % 10) * 0.1}s` }} // אנימציית כניסה מדורגת
                >
                  <div className="player-avatar">
                    {p.nickname.charAt(0)}
                  </div>
                  <div className="player-name">{p.nickname}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="waiting-spinner">
            <div className="loader small-loader"></div>
            <p className="waiting-text pulse-text">
              מחכים שהמארח יתחיל את החידון...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================
     Join Form UI
  ========================== */
  return (
    <div className="join-wrapper">
      <div className="glass-panel form-panel">
        <h1 className="title-glow">היכנס למשחק 🚀</h1>

        {error && <div className="alert-box error-alert slide-in">{error}</div>}

        <div className="join-form">
          <div className="input-container">
            <input
              type="text"
              placeholder=" "
              className="game-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={15}
            />
            <label className="game-label">כינוי (Nickname)</label>
          </div>

          <div className="input-container">
            <input
              type="text"
              placeholder=" "
              className="game-input"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              dir="ltr"
            />
            <label className="game-label">קוד חדר</label>
          </div>

          <button className="join-btn" onClick={handleJoin}>
            הצטרף עכשיו <span className="btn-icon">🎮</span>
          </button>
        </div>
      </div>
    </div>
  );
}