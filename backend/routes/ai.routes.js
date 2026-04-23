const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const { getInsights, simulate, chat } = require("../controllers/ai.controller");

router.get("/insights", protect, getInsights);
router.post("/simulation", protect, simulate);
router.post("/chat", protect, chat);

module.exports = router;
