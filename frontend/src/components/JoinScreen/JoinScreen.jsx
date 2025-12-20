import { useState, useEffect } from "react";
import { socket } from "../../socket";
import "./JoinScreen.css";
import { useNavigate } from "react-router-dom";

export default function JoinScreen() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState(null);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false); // חדש!

  const navigate = useNavigate();

  // מקשיב לעדכוני החדר
  useEffect(() => {
    socket.on("playersUpdated", (players) => {
      setPlayers(players);

      // בודק האם המשתמש נמצא בחדר
      const exists = players.some(p => p.id === socket.id);
      if (exists) {
        setJoined(true);
      }
    });

    socket.on("quizStarted", () => {
      navigate(`/player/game?roomId=${roomId}`);
    });

    return () => {
      socket.off("playersUpdated");
      socket.off("quizStarted");
    };
  }, [roomId]);

  const handleJoin = () => {
    if (!username.trim() || !roomId.trim()) {
      setError("אנא מלא שם וקוד חדר");
      return;
    }    

    socket.emit("joinRoom", {
      roomId,
      user: { id: socket.id, username }
    });
  };


  if (joined) {
    return (
      <div className="room-page">
        <div className="room-card">

          <p className="players-label">
            👥 שחקנים בחדר: <span>{players.length}</span>
          </p>

          <ul className="players-grid">
            {players.map((p) => (
              <li key={p.id} className="player-card">
                <div className="player-avatar">{p.username.charAt(0)}</div>
                <div className="player-info">
                  <span className="player-name">{p.username}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }


  return (
    <div className="join-container">
      <h1>הצטרף לחדר</h1>

      <input
        type="text"
        placeholder="NickName"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
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
