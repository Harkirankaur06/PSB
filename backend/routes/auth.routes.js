const express = require("express");
const router = express.Router();
const { signup, login,getProfile,logout } = require("../controllers/auth.controller");
const protect = require("../middleware/auth.middleware");
const authService = require("../services/auth.service");

router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.post("/logout", protect, logout);
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;