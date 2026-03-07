const Goal = require("../models/Goal");
const FinancialData = require("../models/FinancialData");

function calculateGoalMetrics(goal, monthlySavings) {
  const progressPercentage =
    (goal.currentAmount / goal.targetAmount) * 100;

  let predictedCompletion = null;

  if (monthlySavings > 0) {
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const monthsRequired = Math.ceil(remainingAmount / monthlySavings);

    predictedCompletion = new Date();
    predictedCompletion.setMonth(
      predictedCompletion.getMonth() + monthsRequired
    );
  }

  return {
    progressPercentage: Number(progressPercentage.toFixed(2)),
    predictedCompletion
  };
}

async function createGoal(userId, data) {
  const goal = await Goal.create({
    userId,
    title: data.title,
    targetAmount: data.targetAmount,
    currentAmount: data.currentAmount || 0,
    deadline: data.deadline
  });

  return goal;
}

async function getGoals(userId) {
  const goals = await Goal.find({ userId });

  const financial = await FinancialData.findOne({ userId });
  const monthlySavings = financial
    ? financial.income - financial.expenses
    : 0;

  const enrichedGoals = goals.map(goal => {
    const metrics = calculateGoalMetrics(goal, monthlySavings);
    return {
      ...goal.toObject(),
      ...metrics
    };
  });

  return enrichedGoals;
}

async function updateGoal(userId, goalId, data) {
  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, userId },
    data,
    { new: true }
  );

  return goal;
}

module.exports = {
  createGoal,
  getGoals,
  updateGoal
};