import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        username,
        password
      });

      login({
        token: res.data.token,
        user: res.data.user
      });

      navigate("/my-quizzes"); 
    } catch (err) {
      setError(
        err.response?.data?.message || "שגיאה בהתחברות"
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow"></div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Login to continue</p>

        <div className="input-group">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Username</label>
        </div>

        <div className="input-group">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Password</label>
        </div>

        <button className="auth-button" type="submit">
          Login
        </button>

        {error && <p className="auth-error">{error}</p>}
      </form>
    </div>
  );
}
