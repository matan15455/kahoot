import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // טעינה ראשונית מה־localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);

      connectSocket(storedToken);
    }

    setLoading(false);
  }, []);

  // התחברות
  const login = ({ token }) => {
    localStorage.setItem("token", token);

    setToken(token);

    connectSocket(token);
  };

  // התנתקות
  const logout = () => {
    localStorage.removeItem("token");

    disconnectSocket();
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
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
