const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;

const distributorAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.distributorId = decoded.distributorId;
    next();
  } catch (error) {
    console.error("Invalid token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = distributorAuth;
