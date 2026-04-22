const FinancialData = require("../models/FinancialData");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");

async function generateInsights(userId) {
  const financial = await FinancialData.findOne({ userId });
  const goals = await Goal.find({ userId });
  const transactions = await Transaction.find({ userId });

  if (!financial) {
    return { message: "No financial data available" };
  }

  const insights = [];

  const savingsRate =
    financial.income > 0
      ? (financial.savings / financial.income) * 100
      : 0;

  // 💰 Savings Insight
  if (savingsRate < 20) {
    insights.push("Your savings rate is low. Try to save at least 20% of income.");
  } else {
    insights.push("Good job! Your savings rate is healthy.");
  }

  // 💸 Expense Insight
  if (financial.expenses > financial.income * 0.7) {
    insights.push("Your expenses are high. Consider reducing non-essential spending.");
  }

  // 🎯 Goals Insight
  goals.forEach(goal => {
    const progress =
      (goal.currentAmount / goal.targetAmount) * 100;

    if (progress < 30) {
      insights.push(`Goal "${goal.title}" is behind schedule.`);
    }
  });

  // ⚠️ Risk Insight
  const blockedTx = transactions.filter(t => t.status === "blocked");

  if (blockedTx.length > 0) {
    insights.push("Multiple risky transactions detected. Stay cautious.");
  }

  return {
    insights,
    summary: {
      savingsRate: Number(savingsRate.toFixed(2)),
      totalGoals: goals.length,
      riskyTransactions: blockedTx.length
    }
  };
}
function simulateGoalCompletion({ targetAmount, currentAmount, monthlyInvestment }) {
  if (monthlyInvestment <= 0) {
    return { message: "Monthly investment must be greater than 0" };
  }

  const remaining = targetAmount - currentAmount;
  const months = Math.ceil(remaining / monthlyInvestment);

  const completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + months);

  return {
    monthsRequired: months,
    estimatedCompletion: completionDate
  };
}