const FinancialData = require("../models/FinancialData");

/**
 * Create or Update Financial Data
 */
async function upsertFinancialData(userId, data) {
  const financial = await FinancialData.findOneAndUpdate(
    { userId },
    { ...data, userId },
    { new: true, upsert: true }
  );

  return financial;
}

/**
 * Get Financial Data
 */
async function getFinancialData(userId) {
  const financial = await FinancialData.findOne({ userId });

  if (!financial) {
    return {
      income: 0,
      expenses: 0,
      savings: 0,
      assets: 0,
      investments: 0
    };
  }

  return financial;
}

/**
 * Financial Calculations Engine
 */
function calculateMetrics(financial) {
  const income = financial.income || 0;
  const expenses = financial.expenses || 0;
  const savings = financial.savings || 0;
  const assets = financial.assets || 0;
  const investments = financial.investments || 0;

  const netWorth = assets + investments + savings;
  const monthlyBalance = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const investmentRatio = income > 0 ? (investments / income) * 100 : 0;

  // Health Score Logic
  let healthScore = 0;

  if (savingsRate > 30) healthScore += 30;
  if (netWorth > 500000) healthScore += 30;
  if (investmentRatio > 20) healthScore += 20;
  if (expenses < income * 0.7) healthScore += 20;

  return {
    netWorth,
    monthlyBalance,
    savingsRate: Number(savingsRate.toFixed(2)),
    investmentRatio: Number(investmentRatio.toFixed(2)),
    healthScore
  };
}
const Goal = require("../models/Goal");

async function getFinancialWithGoals(userId) {
  const financial = await getFinancialData(userId);
  const goals = await Goal.find({ userId });

  const metrics = calculateMetrics(financial);

  return {
    financial,
    metrics,
    goals
  };
}
module.exports = {
  upsertFinancialData,
  getFinancialData,
  calculateMetrics,
  getFinancialWithGoals
};