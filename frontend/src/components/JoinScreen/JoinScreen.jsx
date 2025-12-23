import { useState, useEffect, useContext } from "react";
import { getSocket } from "../../socket";
import "./JoinScreen.css";
import { useNavigate } from "react-router-dom";

export default function JoinScreen() {
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const socket = getSocket();

  useEffect(() => {
    const handleRoomUpdated = (roomData) => {
      // תטפל רק בעדכון של החדר שאני נמצא בו
      if (roomData.roomId !== roomId)
         return;

      setRoom(roomData);

      // אם המשחק התחיל – מעבר אוטומטי
      if (roomData.phase === "QUESTION") {
        navigate(`/player/game?roomId=${roomData.roomId}`);
      }
    };

    socket.on("roomUpdated", handleRoomUpdated);

    return () => {
      socket.off("roomUpdated", handleRoomUpdated);
    };
  }, [roomId, navigate]);

  const handleJoin = () => {
    if (!nickname.trim() || !roomId.trim()) {
      setError("אנא מלא שם וקוד חדר");
      return;
    }

    setError("");

    socket.emit("joinRoom", {roomId,nickname});
  };

  /* =====================================================
     UI – Waiting Room
  ===================================================== */
  if (room) {
    return (
      <div className="room-page">
        <div className="room-card">
          <p className="players-label">
            👥 שחקנים בחדר: <span>{room.players.length}</span>
          </p>

          <ul className="players-grid">
            {room.players.map((p) => (
              <li key={p.userId} className="player-card">
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
            <span className="dots" aria-hidden="true">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </p>

        </div>
      </div>
    );
  }

  /* =====================================================
     UI – Join Form
  ===================================================== */
  return (
    <div className="join-container">
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
