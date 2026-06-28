import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // אין Authorization בכלל
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Authorization: Bearer <token>
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // מצמידים את המשתמש לבקשה
    req.user = {
      mongoId: decoded.mongoId,   // ObjectId של Mongo
      username: decoded.username  // שם המשתמש
    };

    next(); // ממשיכים ל־route
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
