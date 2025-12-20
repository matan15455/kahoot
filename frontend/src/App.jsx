import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import JoinScreen from "./components/JoinScreen/JoinScreen";
import MyQuizzes from "./components/MyQuizzes/MyQuizzes";
import QuizCreator from "./components/QuizCreator/QuizCreator";
import CreateRoom from "./components/CreateRoom/CreateRoom";
import HostGame from "./components/HostGame/HostGame";
import PlayerGame from "./components/PlayerGame/PlayerGame";
import { createContext, useState } from 'react';

export const UserContext = createContext();

export default function App() {
  
  const [userId, setUserId] = useState("690f563cbf9d89db6d35a49d");

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      <Router>
        <Navbar />

        <div style={{ paddingTop: "80px" }}>
          <Routes>
            <Route path="/" element={<JoinScreen />} />
            <Route path="/join-room" element={<JoinScreen />} />
            <Route path="/my-quizzes" element={<MyQuizzes />} />
            <Route path="/create-quiz" element={<QuizCreator />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/host/game" element={<HostGame />} />
            <Route path="/player/game" element={<PlayerGame />} />
          </Routes>
        </div>
      </Router>
    </UserContext.Provider>
  );
}