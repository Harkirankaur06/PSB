const FinancialData = require("../models/FinancialData");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");

function safeDivide(value, divisor) {
  if (!divisor) return 0;
  return value / divisor;
}

function getFinancialHealthScore(financial) {
  const income = financial.income || 0;
  const expenses = financial.expenses || 0;
  const savings = financial.savings || 0;
  const investments = financial.investments || 0;
  const debt = 0;

  if (income <= 0) {
    return 0;
  }

  const savingsRate = safeDivide(savings, income);
  const debtRatio = safeDivide(debt, income);
  const investmentRatio = safeDivide(investments, income);

  let score = 0;

  if (savingsRate >= 0.3) {
    score += 30;
  } else if (savingsRate >= 0.2) {
    score += 20;
  } else {
    score += 10;
  }

  if (debtRatio < 0.2) {
    score += 20;
  } else if (debtRatio < 0.4) {
    score += 10;
  }

  if (investmentRatio > 2) {
    score += 25;
  } else if (investmentRatio > 1) {
    score += 15;
  }

  if (savings >= expenses * 6) {
    score += 25;
  }

  return Math.min(score, 100);
}

function getSpendingAnalysis(income, expenses) {
  if (income <= 0) {
    return "We need income data to analyze your spending.";
  }

  const ratio = expenses / income;

  if (ratio > 0.8) {
    return "Your spending is very high compared to income.";
  }

  if (ratio > 0.6) {
    return "You are spending a large portion of income.";
  }

  return "Your spending is under control.";
}

function getRecommendations(financial) {
  const income = financial.income || 0;
  const expenses = financial.expenses || 0;
  const savings = financial.savings || 0;
  const investments = financial.investments || 0;
  const recommendations = [];

  const savingsRate = income > 0 ? savings / income : 0;

  if (savingsRate < 0.2) {
    recommendations.push("Increase savings to at least 20% of income.");
  }

  if (investments === 0) {
    recommendations.push("Start a SIP investment to grow wealth.");
  }

  if (savings < expenses * 3) {
    recommendations.push("Build emergency fund covering 3 months of expenses.");
  }

  if (expenses > income * 0.7) {
    recommendations.push("Reduce discretionary spending.");
  }

  return recommendations;
}

function estimateReturnByType(type, financialHealthScore, riskyTransactions) {
  const baseReturns = {
    invest: 12.4,
    sip: 9.1,
    rebalance: 6.8,
    transfer: 3.2,
  };

  const base = baseReturns[type] ?? 5.5;
  const scoreAdjustment = (financialHealthScore - 50) / 25;
  const riskPenalty = riskyTransactions * 0.6;

  return Number((base + scoreAdjustment - riskPenalty).toFixed(2));
}

function buildPortfolioAssistant(financial, transactions, goals, summary, recommendations) {
  const typeTotals = transactions.reduce((acc, tx) => {
    if (tx.status !== "completed" && tx.status !== "warning") {
      return acc;
    }

    acc[tx.type] = (acc[tx.type] || 0) + (tx.amount || 0);
    return acc;
  }, {});

  const sortedTypes = Object.entries(typeTotals).sort((a, b) => b[1] - a[1]);
  const topType = sortedTypes[0]?.[0] || "invest";

  const labels = {
    invest: "Direct Investments",
    sip: "SIP Contributions",
    rebalance: "Rebalanced Funds",
    transfer: "Cash Transfers",
  };

  const financialHealthScore = summary.financialHealthScore;
  const riskyTransactions = summary.riskyTransactions;
  const estimatedMonthlyReturn = Number(
    (
      estimateReturnByType(topType, financialHealthScore, riskyTransactions) /
      6
    ).toFixed(2)
  );

  let outlook = "steady";
  if (financialHealthScore >= 75 && riskyTransactions === 0) {
    outlook = "strong";
  } else if (financialHealthScore < 45 || riskyTransactions > 1) {
    outlook = "cautious";
  }

  return {
    outlook,
    headline:
      recommendations[0] ||
      (goals.length > 0
        ? "Keep contributing regularly to stay on track with your goals."
        : "Your portfolio is stable. Keep building consistent investment habits."),
    bestPerformerLabel: labels[topType] || "Portfolio Mix",
    bestPerformerReturn: estimateReturnByType(
      topType,
      financialHealthScore,
      riskyTransactions
    ),
    estimatedMonthlyReturn,
    cashMessage:
      (financial.savings || 0) < (financial.expenses || 0) * 3
        ? "Build your emergency fund before taking extra risk."
        : "Cash reserve looks healthy and ready for deployment.",
    estimatedReturns: {
      invest: estimateReturnByType("invest", financialHealthScore, riskyTransactions),
      sip: estimateReturnByType("sip", financialHealthScore, riskyTransactions),
      rebalance: estimateReturnByType("rebalance", financialHealthScore, riskyTransactions),
      transfer: estimateReturnByType("transfer", financialHealthScore, riskyTransactions),
    },
  };
}

async function generateInsights(userId) {
  const financial = await FinancialData.findOne({ userId });
  const goals = await Goal.find({ userId });
  const transactions = await Transaction.find({ userId });

  if (!financial) {
    return { message: "No financial data available" };
  }

  const insights = [];

  const savingsRate =
    financial.income > 0 ? (financial.savings / financial.income) * 100 : 0;

  if (savingsRate < 20) {
    insights.push("Your savings rate is low. Try to save at least 20% of income.");
  } else {
    insights.push("Good job! Your savings rate is healthy.");
  }

  if (financial.expenses > financial.income * 0.7) {
    insights.push("Your expenses are high. Consider reducing non-essential spending.");
  }

  goals.forEach((goal) => {
    const progress =
      goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount) * 100
        : 0;

    if (progress < 30) {
      insights.push(`Goal "${goal.title}" is behind schedule.`);
    }
  });

  const blockedTx = transactions.filter((transaction) => transaction.status === "blocked");

  if (blockedTx.length > 0) {
    insights.push("Multiple risky transactions detected. Stay cautious.");
  }

  const financialHealthScore = getFinancialHealthScore(financial);
  const spendingAnalysis = getSpendingAnalysis(
    financial.income || 0,
    financial.expenses || 0
  );
  const recommendations = getRecommendations(financial);

  const summary = {
    savingsRate: Number(savingsRate.toFixed(2)),
    totalGoals: goals.length,
    riskyTransactions: blockedTx.length,
    financialHealthScore,
    spendingAnalysis,
  };

  return {
    insights,
    recommendations,
    summary,
    portfolioAssistant: buildPortfolioAssistant(
      financial,
      transactions,
      goals,
      summary,
      recommendations
    ),
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

module.exports = { generateInsights, simulateGoalCompletion };
