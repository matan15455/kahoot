import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../socket";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // טעינה ראשונית מה־localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);

      const decoded = jwtDecode(storedToken);
      setUserId(decoded.id);

      connectSocket(storedToken);
    }

    setLoading(false);
  }, []);

  // התחברות
  const login = ({ token }) => {
    localStorage.setItem("token", token);

    setToken(token);

    const decoded = jwtDecode(token);
    setUserId(decoded.id);

    connectSocket(token);
  };

  // התנתקות
  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUserId(null);

    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        isAuthenticated: !!token,
        login,
        logout
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook נוח לשימוש
export function useAuth() {
  return useContext(AuthContext);
}
