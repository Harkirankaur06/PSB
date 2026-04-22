const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal
} = require("../controllers/goal.controller");

router.post("/", protect, createGoal);
router.get("/", protect, getGoals);
router.put("/:id", protect, updateGoal);
router.delete("/:id", protect, deleteGoal);

module.exports = router;
