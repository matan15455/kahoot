import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";

import JoinScreen from "./components/JoinScreen/JoinScreen";
import MyQuizzes from "./components/MyQuizzes/MyQuizzes";
import QuizCreator from "./components/QuizCreator/QuizCreator";
import CreateRoom from "./components/CreateRoom/CreateRoom";
import HostGame from "./components/HostGame/HostGame";
import PlayerGame from "./components/PlayerGame/PlayerGame";

import Login from "./components/Login/Login";
import Register from "./components/Register/Register";

import RequireAuth from "./components/RequireAuth/RequireAuth";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />

        <div style={{ paddingTop: "70px" }}>
          <Routes>

            {/* פתוחים לכולם */}
            <Route path="/" element={<JoinScreen />} />
            <Route path="/join-room" element={<JoinScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* מוגנים – דורשים התחברות */}
            <Route
              path="/my-quizzes"
              element={
                <RequireAuth>
                  <MyQuizzes />
                </RequireAuth>
              }
            />

            <Route
              path="/create-quiz"
              element={
                <RequireAuth>
                  <QuizCreator />
                </RequireAuth>
              }
            />

            <Route
              path="/create-room"
              element={
                <RequireAuth>
                  <CreateRoom />
                </RequireAuth>
              }
            />

            <Route
              path="/host/game"
              element={
                <RequireAuth>
                  <HostGame />
                </RequireAuth>
              }
            />

            <Route
              path="/player/game"
              element={
                <RequireAuth>
                  <PlayerGame />
                </RequireAuth>
              }
            />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
