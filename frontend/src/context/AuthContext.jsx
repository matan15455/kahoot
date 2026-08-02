import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../socket";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // טעינה ראשונית מה־localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);

      const decoded = jwtDecode(storedToken);
      setUsername(decoded.username);

      connectSocket(storedToken);
    }

    setLoading(false);
  }, []);

  // התחברות
  const login = ({ token }) => {
    localStorage.setItem("token", token);

    setToken(token);

    const decoded = jwtDecode(token);
    setUsername(decoded.username);

    connectSocket(token);
  };

  // התנתקות
  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUsername(null);

    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        isAuthenticated: !!token,
        login,
        logout
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}