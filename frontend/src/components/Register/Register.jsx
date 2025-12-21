import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Register
      await axios.post("http://localhost:5000/auth/register", {
        username,
        password
      });

      // 2️⃣ Auto login after register
      const res = await axios.post("http://localhost:5000/auth/login", {
        username,
        password
      });

      // 3️⃣ Save to AuthContext
      login({
        token: res.data.token,
        user: res.data.user
      });

      navigate("/my-quizzes");
      
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow"></div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join and start creating quizzes</p>

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

        {error && <p className="auth-error">{error}</p>}

        <button
          className={`auth-button ${loading ? "loading" : ""}`}
          type="submit"
          disabled={loading}
        >
          {loading ? <span className="loader"></span> : "Register"}
        </button>

        <p className="auth-link" onClick={() => navigate("/login")}>
          Already have an account? <span>Log in</span>
        </p>
      </form>
    </div>
  );
}
