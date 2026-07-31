import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/NavBar/Navbar";

import JoinScreen from "./components/JoinScreen/JoinScreen";
import MyQuizzes from "./components/MyQuizzes/MyQuizzes";
import QuizCreator from "./components/QuizCreator/QuizCreator";
import CreateRoom from "./components/CreateRoom/CreateRoom";
import HostGame from "./components/HostGame/HostGame";
import PlayerGame from "./components/PlayerGame/PlayerGame";
import Profile from "./components/Profile/Profile";
import QuizCreationMode from "./components/QuizCreationMode/QuizCreationMode";
import AICreateQuiz from "./components/AICreateQuiz/AICreateQuiz";
import Statistics from "./components/Statistics/Statistics";
import SessionView from "./components/Statistics/SessionView";

import Login from "./components/Login/Login";
import Register from "./components/Register/Register";

import RequireAuth from "./components/AccessComponents/RequireAuth";
import RequirePlayer from "./components/AccessComponents/RequirePlayer";
import { AuthProvider,useAuth  } from "./context/AuthContext";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


// אם פג תוקף הטוקן נוציא את המשתמש להתחברות
function AxiosInterceptor() {
  const navigate = useNavigate();
  const { logout } = useAuth();
 
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          logout(); // מנקה גם localStorage וגם את ה-state של AuthContext (כולל ה-Navbar)
          navigate("/login");
        }
        return Promise.reject(err);
      }
    );
 
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate, logout]);
 
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AxiosInterceptor />
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
                  <QuizCreationMode />
                </RequireAuth>
              }
            />

            <Route
              path="/create-manual"
              element={
                <RequireAuth>
                  <QuizCreator />
                </RequireAuth>
              }
            />

            <Route
              path="/create-ai"
              element={
                <RequireAuth>
                  <AICreateQuiz/>
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
                <RequirePlayer>
                  <PlayerGame />
                </RequirePlayer>
              }
            />

            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />

            <Route path="/statistics" 
              element={
                <RequireAuth>
                  <Statistics />
                </RequireAuth>
              } 
            />
            <Route path="/statistics/:sessionId"
               element={
                <RequireAuth>
                  <SessionView />
                </RequireAuth>
              } 
            />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
