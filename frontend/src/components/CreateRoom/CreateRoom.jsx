import { useState, useEffect ,useRef} from "react";
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
  }, [quizId, navigate]);


  const startGame = () => {
    if (!room) 
      return;
    socket.emit("startQuiz", { roomId: room.roomId });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 400);
  };

  if (!room) {
    return (
      <div className="create-room-container">
        <h2>יוצר חדר…</h2>
      </div>
    );
  }

  return (
    <div className="create-room-container">
      <div className="room-info">
        <h2>✅ החדר נוצר!</h2>

        <p>
          <span className="room-id" onClick={copyRoomCode}>
            {room.roomId}
          </span>
        </p>

        {copied && <p className="copied-msg">הועתק! 📋</p>}

        <h3>שחקנים בחדר:</h3>
        <ul className="players-list">
          {room.players.map((p) => (
            <li key={p.userId} className="player-item">
              👤 {p.nickname}
            </li>
          ))}
        </ul>

        <div className="start-game-wrapper">
          <button
            className="start-game-btn"
            onClick={startGame}
            disabled={room.players.length === 0}
          >
            ▶ התחל משחק
          </button>
        </div>
      </div>
    </div>
  );
}
