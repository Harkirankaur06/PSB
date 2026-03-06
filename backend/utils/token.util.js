const jwt = require("jsonwebtoken");

const ACCESS_SECRET = "access_secret_key";
const REFRESH_SECRET = "refresh_secret_key";

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};