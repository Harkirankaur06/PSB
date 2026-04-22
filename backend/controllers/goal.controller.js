const goalService = require("../services/goal.service");

async function createGoal(req, res) {
  try {
    const goal = await goalService.createGoal(
      req.user._id,
      req.body
    );
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getGoals(req, res) {
  try {
    const goals = await goalService.getGoals(req.user._id);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateGoal(req, res) {
  try {
    const goal = await goalService.updateGoal(
      req.user._id,
      req.params.id,
      req.body
    );
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteGoal(req, res) {
  try {
    const goal = await goalService.deleteGoal(
      req.user._id,
      req.params.id
    );

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json({ message: "Goal deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal
};
