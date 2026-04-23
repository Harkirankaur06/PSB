const User = require("../models/User");
const RiskLog = require("../models/RiskLog");
const AuditLog = require("../models/AuditLog");
const financialService = require("./financial.service");
const transactionService = require("./transaction.service");
const riskService = require("./risk.service");
const aiService = require("./ai.service");
const securityService = require("./security.service");
const trustedContactService = require("./trustedContact.service");
const marketService = require("./market.service");

function round(value) {
  return Number((value || 0).toFixed(2));
}

function formatCurrencyLabel(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function buildIncomeExpenseSeries(income, expenses) {
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  return monthLabels.map((month, index) => {
    const incomeFactor = 0.9 + ((index % 3) * 0.06);
    const expenseFactor = 0.82 + ((index % 4) * 0.05);

    return {
      month,
      income: Math.round((income || 0) * incomeFactor),
      expenses: Math.round((expenses || 0) * expenseFactor),
    };
  });
}

function buildInvestmentGrowth(netWorth) {
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  let runningValue = Math.max(netWorth * 0.88, 0);

  return monthLabels.map((month, index) => {
    const monthlyStep = 0.01 + index * 0.004;
    runningValue += runningValue * monthlyStep;

    return {
      month,
      value: Math.round(runningValue),
    };
  });
}

function buildAssetAllocation(financial) {
  const buckets = [
    { name: "Investments", value: financial.investments || 0 },
    { name: "Assets", value: financial.assets || 0 },
    { name: "Cash", value: financial.savings || 0 },
  ].filter((item) => item.value > 0);

  const total = buckets.reduce((sum, item) => sum + item.value, 0);

  return buckets.map((item) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));
}

function getRelativeDate(dateValue) {
  const date = new Date(dateValue);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-IN");
}

function buildGoalSummary(goals) {
  return goals.map((goal) => {
    const progress =
      goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

    return {
      id: String(goal._id),
      name: goal.title,
      target: goal.targetAmount,
      current: goal.currentAmount,
      progress: round(progress),
      deadline: goal.deadline,
      predictedCompletion: goal.predictedCompletion,
    };
  });
}

function buildTransactionsSummary(transactions) {
  const typeCounts = transactions.reduce((acc, tx) => {
    acc[tx.type] = (acc[tx.type] || 0) + 1;
    return acc;
  }, {});

  const avgAmount =
    transactions.length > 0
      ? transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0) / transactions.length
      : 0;

  return transactions.map((tx) => {
    const reviewFlags = [];

    if (typeCounts[tx.type] === 1) {
      reviewFlags.push({
        type: "first-time",
        message: `First-time ${tx.type} detected. Additional review is recommended.`,
      });
    }

    if (avgAmount > 0 && tx.amount >= avgAmount * 2) {
      reviewFlags.push({
        type: "high-value",
        message: "This action is materially larger than the user's recent transaction pattern.",
      });
    }

    return {
      id: String(tx._id),
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      riskScore: tx.riskScore || 0,
      date: tx.createdAt,
      relativeDate: getRelativeDate(tx.createdAt),
      description:
        tx.metadata?.assetName ||
        tx.metadata?.name ||
        `${tx.type.charAt(0).toUpperCase()}${tx.type.slice(1)} transaction`,
      metadata: tx.metadata || {},
      reviewFlags,
    };
  });
}

function buildActionItems({ metrics, goals, aiInsights, riskData, transactions, marketIntel }) {
  const items = [];

  if ((metrics.savingsRate || 0) < 20) {
    items.push({
      id: "raise-savings-rate",
      title: "Increase savings rate",
      description: "Your current savings rate is below the 20% comfort zone.",
      status: "recommended",
      priority: "high",
      value: Math.max(metrics.monthlyBalance || 0, 0),
      actionPath: "/goals",
    });
  }

  const behindGoals = goals.filter((goal) => goal.progress < 40);
  if (behindGoals.length > 0) {
    items.push({
      id: "goal-catch-up",
      title: "Catch up on slower goals",
      description: `${behindGoals.length} goals need extra monthly contributions to stay on track.`,
      status: "pending",
      priority: "high",
      value: behindGoals.length * 5000,
      actionPath: "/goals",
    });
  }

  if ((riskData.summary?.totalBlocked || 0) > 0 || (riskData.summary?.totalWarned || 0) > 1) {
    items.push({
      id: "review-risk-alerts",
      title: "Review cyber risk alerts",
      description: "Recent flagged activity suggests your protection settings need a quick review.",
      status: "recommended",
      priority: "high",
      value: (riskData.summary?.totalBlocked || 0) * 10000,
      actionPath: "/security",
    });
  }

  if ((aiInsights.recommendations || []).length > 0) {
    items.push({
      id: "ai-recommendation",
      title: "Apply top AI recommendation",
      description: aiInsights.recommendations[0],
      status: "recommended",
      priority: "medium",
      value: Math.max((metrics.netWorth || 0) * 0.01, 0),
      actionPath: "/insights",
    });
  }

  const firstTimeReview = transactions.find((item) =>
    (item.reviewFlags || []).some((flag) => flag.type === "first-time")
  );
  if (firstTimeReview) {
    items.push({
      id: "first-time-action-review",
      title: "Review first-time investment action",
      description: `Your ${firstTimeReview.type} flow is new for this account. Confirm purpose, beneficiary, and timing before execution.`,
      status: "pending",
      priority: "medium",
      value: firstTimeReview.amount,
      actionPath: "/invest",
      reviewType: "first-time",
      reviewMessage:
        "First-time investment detected - additional review applied before wealth action execution.",
    });
  }

  const highValueReview = transactions.find((item) =>
    (item.reviewFlags || []).some((flag) => flag.type === "high-value")
  );
  if (highValueReview) {
    items.push({
      id: "high-value-review",
      title: "High-value action under review",
      description: `A ${formatCurrencyLabel(highValueReview.amount)} action is above your recent baseline and should be reviewed carefully.`,
      status: "recommended",
      priority: "high",
      value: highValueReview.amount,
      actionPath: "/security",
      reviewType: "high-value",
      reviewMessage:
        "High-value wealth action detected - verify intent, device trust, and market timing before proceeding.",
    });
  }

  if ((marketIntel.recommendations || []).length > 0) {
    items.push({
      id: "market-strategy-review",
      title: "Market strategy review",
      description: marketIntel.recommendations[0],
      status: "recommended",
      priority: "medium",
      value: Math.max((metrics.netWorth || 0) * 0.015, 0),
      actionPath: "/invest",
      reviewType: "market",
      reviewMessage: "Macro and market signals have been ingested into your current strategy guidance.",
    });
  }

  items.push({
    id: "quarterly-review",
    title: "Schedule quarterly review",
    description: `You have ${transactions.length} tracked transactions. A structured review keeps the plan aligned.`,
    status: "scheduled",
    priority: "low",
    value: 0,
    actionPath: "/dashboard",
  });

  return items;
}

function buildProtectionPolicies({ financial, riskData, securityStatus, contacts }) {
  const monthlyExpenses = financial.expenses || 0;
  const emergencyCoverage = monthlyExpenses * 6;
  const digitalCoverage = Math.max((financial.savings || 0) * 0.4, 25000);
  const familyCoverage = contacts.length * 100000;

  return [
    {
      id: "emergency-fund",
      name: "Emergency Reserve Shield",
      status: emergencyCoverage <= (financial.savings || 0) ? "active" : "pending",
      coverage: emergencyCoverage,
      premium: Math.round(monthlyExpenses * 0.03),
      renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      source: "financial",
    },
    {
      id: "cyber-fraud-cover",
      name: "Cyber Fraud Guard",
      status:
        (riskData.protectionScore || 0) >= 70 && securityStatus.hasPin ? "active" : "pending",
      coverage: Math.round(digitalCoverage),
      premium: Math.round(((100 - (riskData.protectionScore || 0)) + 20) * 3),
      renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      source: "cyber",
    },
    {
      id: "family-contact-plan",
      name: "Trusted Contact Recovery Plan",
      status: contacts.length > 0 ? "active" : "inactive",
      coverage: familyCoverage,
      premium: contacts.length > 0 ? contacts.length * 199 : 0,
      renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120),
      source: "contacts",
    },
  ];
}

function buildOpportunityCatalog({ metrics, goals, aiInsights, riskData, financial, marketIntel }) {
  const safetyBias = (riskData.protectionScore || 0) >= 75 ? "moderate" : "low";
  const baseAmount = Math.max(metrics.monthlyBalance || financial.savings || 0, 0);
  const firstGoal = goals[0];
  const marketHeadline = marketIntel.recommendations?.[0] || marketIntel.headline;

  return [
    {
      id: "goal-linked-sip",
      name: firstGoal ? `${firstGoal.name} Accelerator SIP` : "Goal Accelerator SIP",
      category: "Goal-linked",
      description: firstGoal
        ? `Boost contributions toward ${firstGoal.name} using your monthly surplus.`
        : "Turn monthly surplus into automated progress toward your next goal.",
      expectedReturn: 8.5,
      riskLevel: safetyBias,
      minimumInvestment: Math.max(Math.round(baseAmount * 0.25), 1000),
      fundSize: Math.max(Math.round((firstGoal?.target || 250000) * 0.35), 50000),
      fundRaised: Math.max(Math.round((firstGoal?.current || 0) * 0.75), 0),
      investorCount: Math.max(goals.length * 12, 24),
      featured: true,
      source: "ai",
    },
    {
      id: "income-compound-basket",
      name: "Income Compound Basket",
      category: "Diversified",
      description:
        marketHeadline ||
        aiInsights.portfolioAssistant?.headline ||
        "Balance growth and cash resilience using your current asset mix.",
      expectedReturn: aiInsights.portfolioAssistant?.bestPerformerReturn || 10.2,
      riskLevel: (metrics.healthScore || 0) >= 70 ? "moderate" : "low",
      minimumInvestment: Math.max(Math.round((financial.income || 0) * 0.15), 2000),
      fundSize: Math.max(Math.round((metrics.netWorth || 100000) * 0.2), 100000),
      fundRaised: Math.max(Math.round((financial.investments || 0) * 0.6), 0),
      investorCount: 88,
      source: "portfolio",
    },
    {
      id: "cyber-resilient-cash",
      name: "Cyber Resilient Cash Ladder",
      category: "Capital Protection",
      description:
        "Keep more capital liquid while your cyber trust score strengthens and alerts cool down.",
      expectedReturn: 6.1,
      riskLevel: "low",
      minimumInvestment: Math.max(Math.round((financial.savings || 0) * 0.1), 1000),
      fundSize: Math.max(Math.round((financial.savings || 0) * 0.6), 50000),
      fundRaised: Math.max(Math.round((financial.savings || 0) * 0.3), 0),
      investorCount: Math.max((riskData.summary?.totalAllowed || 0) + 30, 30),
      source: "cyber",
    },
    {
      id: "macro-shift-ladder",
      name: "Macro Shift Allocation",
      category: "Market Intelligence",
      description:
        marketIntel.recommendations?.[1] ||
        "Adaptive allocation shaped by rates, inflation, and global market momentum.",
      expectedReturn: 7.4,
      riskLevel: ratesToRiskLevel(marketIntel),
      minimumInvestment: Math.max(Math.round((financial.income || 0) * 0.2), 3000),
      fundSize: Math.max(Math.round((metrics.netWorth || 0) * 0.18), 75000),
      fundRaised: Math.max(Math.round((financial.investments || 0) * 0.4), 0),
      investorCount: 64,
      featured: false,
      source: marketIntel.source,
    },
  ];
}

function ratesToRiskLevel(marketIntel) {
  const rates = (marketIntel.indicators || []).find((item) => item.category === "rates");
  if (!rates) return "moderate";
  if (rates.changePercent > 1) return "low";
  if (rates.changePercent < -1) return "high";
  return "moderate";
}

function buildSecurityFeed({ user, securityStatus, riskData, transactions, logs }) {
  const feed = [];

  feed.push({
    id: "account-created",
    title: "Account protection baseline",
    description: `${user.name}'s account trust score is ${user.trustScore}/100.`,
    date: user.createdAt,
    icon: "Shield",
    type: "account",
  });

  if (securityStatus.hasPin) {
    feed.push({
      id: "pin-enabled",
      title: "PIN protection enabled",
      description: "PIN-based step-up verification is configured.",
      date: user.updatedAt,
      icon: "Lock",
      type: "security",
    });
  }

  transactions.slice(0, 6).forEach((tx) => {
    feed.push({
      id: `tx-${tx.id}`,
      title: `${tx.type} ${tx.status}`,
      description: `${formatCurrencyLabel(tx.amount)} recorded with risk score ${tx.riskScore || 0}.`,
      date: tx.date,
      icon: tx.status === "blocked" ? "AlertTriangle" : "TrendingUp",
      type: "transaction",
    });
  });

  logs.slice(0, 4).forEach((log, index) => {
    feed.push({
      id: `risk-log-${index}`,
      title: `Cyber engine decision: ${log.decision}`,
      description: log.reason || `${log.action} triggered a ${log.decision} decision.`,
      date: log.createdAt,
      icon: log.decision === "block" ? "AlertTriangle" : "CheckCircle",
      type: "risk",
    });
  });

  return feed.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function formatRelativeTime(dateValue) {
  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function buildHeaderNotifications({ profile, goals, transactions, riskData, auditLogs }) {
  const notifications = [];

  if ((riskData.summary?.totalBlocked || 0) > 0) {
    notifications.push({
      id: "blocked-activity",
      title: "Security Alert",
      description: `${riskData.summary.totalBlocked} transaction attempts were blocked by the cyber engine.`,
      timestamp: formatRelativeTime(new Date()),
      read: false,
      type: "security",
    });
  }

  const nearestGoal = [...goals]
    .filter((goal) => goal.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  if (nearestGoal) {
    notifications.push({
      id: `goal-${nearestGoal.id}`,
      title: "Goal Progress",
      description: `${nearestGoal.name} is ${nearestGoal.progress}% funded.`,
      timestamp: nearestGoal.deadline
        ? `Due ${new Date(nearestGoal.deadline).toLocaleDateString("en-IN")}`
        : "Goal updated",
      read: nearestGoal.progress >= 75,
      type: "goal",
    });
  }

  const latestCompletedTransaction = transactions.find((item) => item.status === "completed");
  if (latestCompletedTransaction) {
    notifications.push({
      id: `transaction-${latestCompletedTransaction.id}`,
      title: "Portfolio Update",
      description: `${formatCurrencyLabel(
        latestCompletedTransaction.amount
      )} moved through ${latestCompletedTransaction.type}.`,
      timestamp: latestCompletedTransaction.relativeDate,
      read: false,
      type: "portfolio",
    });
  }

  const latestAudit = auditLogs[0];
  if (latestAudit) {
    notifications.push({
      id: `audit-${latestAudit._id}`,
      title: "Profile Activity",
      description: `${profile.name}, your latest account event was ${latestAudit.action}.`,
      timestamp: formatRelativeTime(latestAudit.createdAt),
      read: true,
      type: "account",
    });
  }

  if (notifications.length === 0) {
    notifications.push({
      id: "welcome",
      title: "Welcome Back",
      description: "Your dashboard, profile, and notifications are now powered by live backend data.",
      timestamp: "just now",
      read: false,
      type: "account",
    });
  }

  return notifications.slice(0, 6);
}

async function getOverview(user, session) {
  const [profile, financialResult, transactionsRaw, aiInsights, riskData, securityStatus, contacts, marketIntel] =
    await Promise.all([
      User.findById(user._id),
      financialService.getFinancialWithGoals(user._id),
      transactionService.getTransactionHistory(user._id),
      aiService.generateInsights(user._id),
      riskService.getRiskDashboard(user),
      securityService.getSecurityStatus(user._id, session),
      trustedContactService.getTrustedContacts(user._id),
      marketService.getMarketIntelligence(),
    ]);

  const financial = financialResult.financial;
  const metrics = financialResult.metrics;
  const goals = buildGoalSummary(financialResult.goals);
  const transactions = buildTransactionsSummary(transactionsRaw);
  const assetAllocation = buildAssetAllocation(financial);
  const dashboard = {
    portfolio: {
      totalValue: metrics.netWorth,
      previousValue: round(metrics.netWorth * 0.97),
      changeAmount: round(metrics.netWorth * 0.03),
      changePercent: 3,
    },
    incomeVsExpenses: buildIncomeExpenseSeries(financial.income, financial.expenses),
    assetAllocation,
    investmentGrowth: buildInvestmentGrowth(metrics.netWorth),
    goals,
    recentTransactions: transactions.slice(0, 5),
    insights: (aiInsights.insights || []).slice(0, 3).map((message, index) => ({
      id: `insight-${index}`,
      title: index === 0 ? "AI guidance" : "Portfolio insight",
      description: message,
    })),
    trustScore: {
      score: riskData.trustScore,
      level:
        riskData.trustScore >= 85
          ? "Excellent"
          : riskData.trustScore >= 70
            ? "Good"
            : "Needs Attention",
      protectionScore: riskData.protectionScore,
    },
  };

  return {
    profile: {
      id: String(profile._id),
      name: profile.name,
      email: profile.email,
      trustScore: profile.trustScore,
      devices: profile.devices || [],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    },
    financial,
    metrics,
    goals,
    transactions,
    dashboard,
    ai: aiInsights,
    market: marketIntel,
    cyber: {
      ...riskData,
      securityStatus,
    },
    contacts,
    actions: buildActionItems({
      metrics,
      goals,
      aiInsights,
      riskData,
      transactions,
      marketIntel,
    }),
    protection: buildProtectionPolicies({
      financial,
      riskData,
      securityStatus,
      contacts,
    }),
    opportunities: buildOpportunityCatalog({
      metrics,
      goals,
      aiInsights,
      riskData,
      financial,
      marketIntel,
    }),
  };
}

async function getContacts(userId) {
  return trustedContactService.getTrustedContacts(userId);
}

async function createContact(userId, data) {
  return trustedContactService.createTrustedContact(userId, data);
}

async function updateContact(userId, contactId, data) {
  return trustedContactService.updateTrustedContact(userId, contactId, data);
}

async function deleteContact(userId, contactId) {
  return trustedContactService.deleteTrustedContact(userId, contactId);
}

async function getSecurityFeed(user, session) {
  const [securityStatus, riskData, transactionDocs, logs] = await Promise.all([
    securityService.getSecurityStatus(user._id, session),
    riskService.getRiskDashboard(user),
    transactionService.getTransactionHistory(user._id),
    RiskLog.find({ userId: user._id }).sort({ createdAt: -1 }).limit(8),
  ]);

  return {
    status: securityStatus,
    cyber: riskData,
    timeline: buildSecurityFeed({
      user,
      securityStatus,
      riskData,
      transactions: buildTransactionsSummary(transactionDocs),
      logs,
    }),
  };
}

async function getHeaderData(user, session) {
  const [profile, financialResult, transactionDocs, riskData, securityStatus, auditLogs] =
    await Promise.all([
      User.findById(user._id),
      financialService.getFinancialWithGoals(user._id),
      transactionService.getTransactionHistory(user._id, 10),
      riskService.getRiskDashboard(user),
      securityService.getSecurityStatus(user._id, session),
      AuditLog.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5),
    ]);

  const goals = buildGoalSummary(financialResult.goals);
  const transactions = buildTransactionsSummary(transactionDocs);

  return {
    profile: {
      id: String(profile._id),
      name: profile.name,
      email: profile.email,
      trustScore: profile.trustScore,
      devices: profile.devices || [],
      balance: financialResult.financial.savings || 0,
      netWorth: financialResult.metrics.netWorth || 0,
      securityStatus,
    },
    notifications: buildHeaderNotifications({
      profile,
      goals,
      transactions,
      riskData,
      auditLogs,
    }),
  };
}

module.exports = {
  getOverview,
  getHeaderData,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getSecurityFeed,
};
