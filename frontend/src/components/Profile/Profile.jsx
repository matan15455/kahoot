import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {isValidEmail,isValidPhone,isAdult21,isValidPassword} from "../../utils/validators";
import "./Profile.css";
import CircularProgress from '@mui/material/CircularProgress';
import Box from "@mui/material/Box";

export default function Profile() {
  const { token, userId, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: "",
    password: "", 
    id: "", 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId)
      return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUserData({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone,
          birthday: res.data.birthday,
          password: "",
          id: res.data.id,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, userId]);

  const handleUpdate = async () => {
    if (!userId) return;

    setError("");

    if (!isValidEmail(userData.email)) {
      setError("אימייל לא תקין");
      return;
    }

    if (!isValidPhone(userData.phone)) {
      setError("מספר טלפון לא תקין");
      return;
    }

    if (!isAdult21(userData.birthday)) {
      setError("המשתמש חייב להיות מעל גיל 21");
      return;
    }

    if (userData.password && !isValidPassword(userData.password)) {
      setError(
        "הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה, ספרה ותו מיוחד"
      );
      return;
    }

    const updates = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      birthday: userData.birthday,
    };

    if (userData.password) {
      updates.password = userData.password;
    }

    try {
      setLoading(true);
      await axios.patch(
        `http://localhost:5000/user/${userId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("פרטים עודכנו בהצלחה!");
      setUserData(prev => ({ ...prev, password: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Error updating user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    if (!window.confirm("האם אתה בטוח שאתה רוצה למחוק את המשתמש?")) 
      return;

    setLoading(true);
    setError("");
    try {
      await axios.delete(`http://localhost:5000/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("המשתמש נמחק בהצלחה");
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting user");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <h1 className="profile-title">👤 פרטי משתמש</h1>

        {error && <div className="error-box">{error}</div>}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh"
            }}
          >
            <CircularProgress color="secondary" size={80} />
          </Box>
        ) : (
          <div className="profile-form">
            <div className="id-display">
              <div className="id-label">תעודת זהות</div>
              <div className="id-value">{userData.id}</div>
            </div>

            <div className="input-group">
              <input name="name" value={userData.name || ""} onChange={handleChange} required />
              <label>שם מלא</label>
            </div>

            <div className="input-group">
              <input name="email" value={userData.email || ""} onChange={handleChange} required />
              <label>אימייל</label>
            </div>

            <div className="input-group">
              <input name="phone" value={userData.phone || ""} onChange={handleChange} />
              <label>טלפון</label>
            </div>

            <div className="input-group">
              <input type="date" name="birthday" value={userData.birthday || ""} onChange={handleChange} />
              <label>תאריך לידה</label>
            </div>

            <div className="input-group">
              <input type="password" name="password" value={userData.password || ""} onChange={handleChange} />
              <label>סיסמה חדשה</label>
            </div>

            <button className="btn primary" onClick={handleUpdate} disabled={loading}>
              💾 שמור שינויים
            </button>

            <button className="btn danger" onClick={handleDelete} disabled={loading}>
              🗑 מחק משתמש
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
