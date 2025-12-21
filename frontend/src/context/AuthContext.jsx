import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // { userId, username }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // טעינה ראשונית מה־localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // התחברות
  const login = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);

    connectSocket(token);
  };

  // התנתקות
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    disconnectSocket();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
