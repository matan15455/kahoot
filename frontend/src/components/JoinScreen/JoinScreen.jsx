import { useState, useEffect } from "react";
import { getSocket, connectSocket } from "../../socket";
import { useLocation } from "react-router-dom";
import "./JoinScreen.css";
import { useNavigate } from "react-router-dom";

export default function JoinScreen() {
  const [socket, setSocket] = useState(null);
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const location = useLocation();
  const message = location.state?.message;


  useEffect(() => {
    let s = getSocket();

    if (!s) {
      s = connectSocket();   // אורח בלי token
    }

    setSocket(s);
  }, []);


  useEffect(() => {
    if (!socket) 
      return;   

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


  if (room) {
    return (
      <div className="room-page">

        <div className="room-card">
          <p className="players-label">
            👥 שחקנים בחדר: <span>{room.players.length}</span>
          </p>

          <ul className="players-grid">
            {room.players.map((p) => (
              <li key={p.socketId} className="player-card">
                <div className="player-avatar">
                  {p.nickname.charAt(0)}
                </div>
                <div className="player-info">
                  <span className="player-name">{p.nickname}</span>
                </div>
              </li>
            ))}
          </ul>

          <p className="waiting-text">
            ⏳ מחכים שהמארח יתחיל את החידון
            <span className="dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </p>
        </div>
      </div>
    );
  }

  /* ==========================
     Join Form UI
  ========================== */
  return (
    <div className="join-container">

      {message && (
          <div className="ep-join__error" role="alert">
            <span className="ep-join__error-icon">!</span>
            <span>{message}</span>
          </div>
      )}

      <h1>הצטרף לחדר</h1>

      <input
        type="text"
        placeholder="NickName"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <input
        type="text"
        placeholder="קוד חדר"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <button onClick={handleJoin}>הצטרף</button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
