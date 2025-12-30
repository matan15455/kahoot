import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../socket";

export default function RequirePlayer({ children }) {
  const { isAuthenticated } = useAuth();
  const socket = getSocket();

  if (!isAuthenticated && !socket) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
