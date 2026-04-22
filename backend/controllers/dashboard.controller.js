const financialService = require("../services/financial.service");
const goalService = require("../services/goal.service");
const transactionService = require("../services/transaction.service");
const riskService = require("../services/risk.service");
const User = require("../models/User");

async function getDashboard(req, res) {
  try {
    const userId = req.user._id;

    // Get financial data with goals
    const financialData = await financialService.getFinancialWithGoals(userId);
    const { financial, metrics, goals } = financialData;

    // Get recent transactions (last 5)
    const transactions = await transactionService.getTransactionHistory(userId, 5);

    // Get risk dashboard data
    const riskData = await riskService.getRiskDashboard(req.user);

    // Get user info
    const user = await User.findById(userId);
    const userName = user ? user.name : "User";

    // Transform goals data
    const transformedGoals = goals.map(goal => ({
      id: goal._id,
      name: goal.name,
      target: goal.targetAmount,
      current: goal.currentAmount,
      progress: (goal.currentAmount / goal.targetAmount) * 100
    }));

    // Transform transactions data
    const transformedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      description: tx.description || `${tx.type} transaction`,
      amount: tx.amount,
      date: getRelativeDate(tx.createdAt)
    }));

    // Calculate portfolio data
    const totalValue = metrics.netWorth;
    const previousValue = totalValue * 0.98; // Mock previous value (2% less)
    const changeAmount = totalValue - previousValue;
    const changePercent = (changeAmount / previousValue) * 100;

    // Mock income vs expenses (last 6 months)
    const incomeVsExpenses = generateIncomeExpensesData(financial.income || 0, financial.expenses || 0);

    // Mock asset allocation
    const assetAllocation = generateAssetAllocation(metrics.netWorth, financial);

    // Mock investment growth (last 6 months)
    const investmentGrowth = generateInvestmentGrowth(totalValue);

    // Generate AI insights based on data
    const insights = generateInsights(metrics, goals, riskData);

    // Transform trust score
    const trustScore = {
      score: riskData.trustScore,
      level: getTrustLevel(riskData.trustScore),
      factors: [
        { name: 'Account Age', score: 95 }, // Mock
        { name: 'Transaction History', score: riskData.trustScore },
        { name: 'Identity Verification', score: 78 }, // Mock
      ]
    };

    const dashboardData = {
      portfolio: {
        totalValue,
        previousValue,
        changePercent: Number(changePercent.toFixed(2)),
        changeAmount
      },
      incomeVsExpenses,
      assetAllocation,
      investmentGrowth,
      goals: transformedGoals,
      recentTransactions: transformedTransactions,
      insights,
      trustScore
    };

    res.json(dashboardData);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Helper functions
function getRelativeDate(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function generateIncomeExpensesData(avgIncome, avgExpenses) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    income: Math.round(avgIncome * (0.8 + Math.random() * 0.4)), // ±20% variation
    expenses: Math.round(avgExpenses * (0.8 + Math.random() * 0.4))
  }));
}

function generateAssetAllocation(netWorth, financial) {
  const investments = financial.investments || 0;
  const assets = financial.assets || 0;
  const savings = financial.savings || 0;

  const total = investments + assets + savings;
  if (total === 0) return [];

  return [
    { name: 'Stocks', value: investments, percentage: Math.round((investments / total) * 100) },
    { name: 'Bonds', value: assets, percentage: Math.round((assets / total) * 100) },
    { name: 'Cash', value: savings, percentage: Math.round((savings / total) * 100) }
  ].filter(item => item.value > 0);
}

function generateInvestmentGrowth(currentValue) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  let value = currentValue * 0.9; // Start 10% lower

  return months.map(month => {
    value *= (1 + (Math.random() * 0.04 - 0.01)); // ±3% monthly growth
    return {
      month,
      value: Math.round(value)
    };
  });
}

function generateInsights(metrics, goals, riskData) {
  const insights = [];

  // Savings rate insight
  if (metrics.savingsRate > 30) {
    insights.push({
      icon: 'TrendingUp',
      title: 'Excellent Savings Rate',
      description: `Your ${metrics.savingsRate}% savings rate is above average`
    });
  } else if (metrics.savingsRate < 15) {
    insights.push({
      icon: 'AlertCircle',
      title: 'Low Savings Rate',
      description: 'Consider increasing your savings to build wealth faster'
    });
  }

  // Goal progress insight
  const onTrackGoals = goals.filter(goal => (goal.currentAmount / goal.targetAmount) > 0.5).length;
  if (onTrackGoals > 0) {
    insights.push({
      icon: 'Target',
      title: 'Goals On Track',
      description: `${onTrackGoals} of your goals are more than 50% complete`
    });
  }

  // Trust score insight
  if (riskData.trustScore > 80) {
    insights.push({
      icon: 'Shield',
      title: 'Strong Security',
      description: 'Your account has excellent security ratings'
    });
  }

  // Default insights if none generated
  if (insights.length === 0) {
    insights.push(
      { icon: 'TrendingUp', title: 'Portfolio Growing', description: 'Your investments are performing well' },
      { icon: 'Target', title: 'Stay Focused', description: 'Keep contributing to your goals regularly' }
    );
  }

  return insights.slice(0, 3); // Max 3 insights
}

function getTrustLevel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
}

module.exports = { getDashboard };