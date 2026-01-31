import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

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

  // GET – מביא את פרטי המשתמש
  useEffect(() => {
    if (!userId) return;

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

    setLoading(true);
    setError("");

    const updates = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      birthday: userData.birthday,
    };

    if (userData.password) updates.password = userData.password;

    try {
      await axios.patch(`http://localhost:5000/user/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    if (!window.confirm("האם אתה בטוח שאתה רוצה למחוק את המשתמש?")) return;

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
    <div className="profile-page">
      <h1>פרטי המשתמש</h1>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>טוען...</p>
      ) : (
        <div className="profile-form">
          {/* ת.ז מוצגת כטקסט בלבד */}
          <p>
            <strong>תעודת זהות:</strong> {userData.id}
          </p>

          <label>
            שם:
            <input name="name" value={userData.name || ""} onChange={handleChange} />
          </label>
          <label>
            אימייל:
            <input name="email" value={userData.email || ""} onChange={handleChange} />
          </label>
          <label>
            טלפון:
            <input name="phone" value={userData.phone || ""} onChange={handleChange} />
          </label>
          <label>
            תאריך לידה:
            <input name="birthday" type="date" value={userData.birthday || ""} onChange={handleChange} />
          </label>
          <label>
            סיסמה חדשה:
            <input name="password" type="password" value={userData.password || ""} placeholder="סיסמה חדשה" onChange={handleChange} />
          </label>

          <button onClick={handleUpdate} disabled={loading}>עדכן פרטים</button>
          <button onClick={handleDelete} disabled={loading} className="delete-btn">מחק משתמש</button>
        </div>
      )}
    </div>
  );
}
