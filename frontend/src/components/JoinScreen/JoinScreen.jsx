import { useState, useEffect,useRef } from "react";
import { getSocket, connectSocket } from "../../socket";
import { useNavigate } from "react-router-dom";
import { EpShape } from "../_shared/EpBrand";
import "./JoinScreen.css";

export default function JoinScreen() {
  const [socket, setSocket] = useState(null);
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState(null);

  const [error, setError] = useState(() => {

  // שולף את ההודעה ששמרנו כאשר משתמש מוסר מהחדר כדי להציג לו את הסיבה
  const msg = sessionStorage.getItem("kickedMessage");
  if (msg) {
      sessionStorage.removeItem("kickedMessage");
      return msg;
    }
    return "";
  });

  const navigate = useNavigate();

  // מקבל את מזהה החיבור 
  useEffect(() => {
    let s = getSocket();

    if (!s) {
      s = connectSocket();   // אורח בלי token
    }

    setSocket(s);
  }, []);

  const gameStartingRef = useRef(false); // true אם עוזבים כי המשחק התחיל (לא לשלוח leaveRoom)
  const joinedRoomIdRef = useRef(null);


  useEffect(() => {
    if (!socket)
      return;
    
    // מציג את החדר במידה ויש עדכון ומעביר לנתיב המשחק אם המשחק התחיל
    const handleRoomUpdated = (roomData) => {
      if (roomData.roomId !== roomId) 
        return;

      setRoom(roomData);
      joinedRoomIdRef.current = roomData.roomId;

      if (roomData.phase === "QUESTION") {
        gameStartingRef.current = true;
        navigate(`/player/game?roomId=${roomData.roomId}`);
      }
    };

    // אם השחקן הוסר נשמור את ההודעה כדי להציג אותה בהמשך
    const handleKicked = () => {
      sessionStorage.setItem("kickedMessage", "הוסרת מהחדר על ידי המארח");
      window.location.reload();
    };

    socket.on("kicked", handleKicked);

    socket.on("roomUpdated", handleRoomUpdated);

    return () => {
      socket.off("kicked", handleKicked);
      socket.off("roomUpdated", handleRoomUpdated);

      if (!gameStartingRef.current && joinedRoomIdRef.current) {
        socket.emit("leaveRoom", { roomId: joinedRoomIdRef.current });
      }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    handleJoin();
  };

  /* ============ Lobby (אחרי הצטרפות) ============ */
  if (room) {
    return (
      <div className="ep-join">
        <div className="ep-join__shell">

          {/* כרטיס " */}
          <div className="ep-join__you">
            <p className="ep-join__you-label">השם שלך בחדר</p>
            <p className="ep-join__you-name">{nickname}</p>
            <div className="ep-join__you-status">
              <span className="ep-join__pulse" />
              ממתין שהמארח יתחיל את המשחק
            </div>
          </div>

          {/* רשימת שחקנים */}
          <div className="ep-join__roster">
            <div className="ep-join__roster-head">
              <span className="ep-join__roster-title">בחדר עכשיו</span>
              <span className="ep-join__roster-count">
                {room.players.length} שחקנים
              </span>
            </div>

            <ul className="ep-join__players">
              {room.players.map((p) => {
                const isYou = p.nickname === nickname;
                return (
                  <li
                    key={p.socketId}
                    className={"ep-join__player" + (isYou ? " is-you" : "")}
                  >
                    <div className="ep-join__avatar">{p.nickname.charAt(0)}</div>
                    <span className="ep-join__player-name">{p.nickname}</span>
                    {isYou && <span className="ep-join__player-tag">אתה</span>}
                  </li>
                );
              })}
            </ul>
          </div>

        </div>
      </div>
    );
  }

  /* ============ טופס הצטרפות ============ */
  return (
    <div className="ep-join">
      <form className="ep-join__form" onSubmit={handleSubmit} noValidate>

        <div className="ep-join__hero">
          <span className="ep-join__kicker">
          </span>
          <h1 className="ep-join__title">
            הצטרף<br />
            <span className="ep-join__title-accent">לחדר.</span>
          </h1>
          <p className="ep-join__sub">
            הזן את קוד החדר שקיבלת מהמארח ובחר לעצמך שם.
          </p>
        </div>

        <div className="ep-join__fields">
          {/* קוד חדר */}
          <div className="ep-field">
            <label className="ep-field__label" htmlFor="join-pin">קוד חדר</label>
            <input
              id="join-pin"
              className="ep-field__input ep-join__pin"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* שם */}
          <div className="ep-field">
            <label className="ep-field__label" htmlFor="join-name">השם שלך</label>
            <input
              id="join-name"
              className="ep-field__input"
              type="text"
              placeholder="לדוגמה: מתן עמרם"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="off"
              maxLength={20}
            />
          </div>

          {error && (
            <div className="ep-join__error" role="alert" aria-live="polite">
              <span className="ep-join__error-icon">!</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <button className="ep-join__submit" type="submit">
          <span>להצטרפות למשחק</span>
        </button>

      </form>
    </div>
  );
}
