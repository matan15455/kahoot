import { useState, useEffect,useContext } from "react";
import { socket } from "../../socket";
import "./CreateRoom.css";
import { useSearchParams,useNavigate } from "react-router-dom";
import { UserContext } from "../../App";


export default function CreateRoom() {
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([]);
  const [copied, setCopied] = useState(false);

  const { userId } = useContext(UserContext);
  
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("quizId"); // ⬅️ מביא את ה-quizId מה-URL


  useEffect(() => {

    socket.emit("createRoom", { hostId: userId, quizId });

    // כאשר החדר נוצר
    const handleRoomCreated = ({ roomId }) => {
      setRoomId(roomId);
      console.log("חדר נוצר:", roomId);
    };

    // כאשר החדר מתעדכן (שחקן נכנס / נקודות משתנות)
    const handlePlayersUpdate = (players) => {
      setPlayers(players);
    };

    socket.on("roomCreated", handleRoomCreated);
    socket.on("playersUpdated", handlePlayersUpdate);

    return () => {
      socket.off("roomCreated", handleRoomCreated);
      socket.off("playersUpdated", handlePlayersUpdate);
    };
  }, []);


  const startGame = () => {
    socket.emit("startQuiz", { roomId });
    navigate(`/host/game?roomId=${roomId}`);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);

    setTimeout(() => setCopied(false), 200);
  };

  return (
    <div className="create-room-container">

      {roomId && (
        <div className="room-info">
          <h2>✅ החדר נוצר!</h2>
          <p>
            <span className="room-id" onClick={copyRoomCode}>{roomId}</span>
            <div>
              {copied && <p className="copied-msg">הועתק! 📋</p>}
            </div>
          </p>

          <h3>שחקנים בחדר:</h3>
          <ul className="players-list">
            {players.map((p) => (
              <li key={p.id} className="player-item">
                👤 {p.username}
              </li>
            ))}
          </ul>
          <div className="start-game-wrapper">
            <button className="start-game-btn" onClick={startGame}>
              ▶ התחל משחק
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
