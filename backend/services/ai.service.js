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

function buildChatContext(financial, goals, transactions, insightPayload) {
  const goalsSummary =
    goals.length > 0
      ? goals
          .slice(0, 3)
          .map((goal) => `${goal.title}: ${goal.currentAmount}/${goal.targetAmount}`)
          .join("; ")
      : "No active goals";

  const transactionSummary =
    transactions.length > 0
      ? transactions
          .slice(-5)
          .map((tx) => `${tx.type} ${tx.status} ${tx.amount}`)
          .join("; ")
      : "No recent transactions";

  return [
    `Income: ${financial.income || 0}`,
    `Expenses: ${financial.expenses || 0}`,
    `Savings: ${financial.savings || 0}`,
    `Investments: ${financial.investments || 0}`,
    `Goals: ${goalsSummary}`,
    `Recent transactions: ${transactionSummary}`,
    `AI insights: ${(insightPayload.insights || []).join(" | ") || "None"}`,
    `Recommendations: ${(insightPayload.recommendations || []).join(" | ") || "None"}`,
    `Health score: ${insightPayload.summary?.financialHealthScore ?? "unknown"}`,
  ].join("\n");
}

const NAVIGATION_TARGETS = {
  "/dashboard": ["dashboard", "overview", "summary", "home"],
  "/portfolio": ["portfolio", "holdings", "allocation", "investments summary"],
  "/invest": ["invest", "sip", "investment", "start investing", "buy", "deploy cash"],
  "/goals": ["goal", "goals", "planning", "target", "save for", "deadline"],
  "/insights": ["insight", "insights", "recommendation", "recommendations", "ai"],
  "/actions": ["action", "actions", "next step", "task", "priority"],
  "/security": ["security", "verify", "fraud", "risk", "duress", "protection check"],
  "/contacts": ["contact", "contacts", "trusted contact", "family"],
  "/settings": ["setting", "settings", "password", "pin", "otp", "device", "account"],
  "/twin": ["twin", "securewealth twin", "simulation", "workflow"],
};

const ALLOWED_SCOPE_TERMS = [
  "my",
  "me",
  "mine",
  "account",
  "balance",
  "income",
  "expense",
  "expenses",
  "saving",
  "savings",
  "goal",
  "goals",
  "portfolio",
  "invest",
  "investment",
  "transaction",
  "transactions",
  "risk",
  "security",
  "fraud",
  "pin",
  "otp",
  "duress",
  "settings",
  "dashboard",
  "insight",
  "insights",
  "action",
  "actions",
  "contact",
  "contacts",
  "navigate",
  "where",
  "which page",
  "page",
  "screen",
  "open",
  "take me",
];

const BLOCKED_GLOBAL_TERMS = [
  "world",
  "global",
  "news",
  "today's news",
  "president",
  "prime minister",
  "war",
  "weather",
  "sports",
  "movie",
  "celebrity",
  "bitcoin price",
  "stock market today",
  "who won",
  "around the world",
];

function detectNavigationTarget(text) {
  const lower = text.toLowerCase();

  for (const [href, keywords] of Object.entries(NAVIGATION_TARGETS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return href;
    }
  }

  return null;
}

function isInUserOnlyScope(text) {
  const lower = text.toLowerCase();
  const hasAllowedSignal = ALLOWED_SCOPE_TERMS.some((term) => lower.includes(term));
  const hasBlockedSignal = BLOCKED_GLOBAL_TERMS.some((term) => lower.includes(term));

  if (hasBlockedSignal && !hasAllowedSignal) {
    return false;
  }

  return hasAllowedSignal;
}

function buildScopeRefusal(text) {
  const navigationTarget = detectNavigationTarget(text);

  return {
    provider: "scope-guard",
    model: "local",
    reply:
      "I can only help with your own L.E.G.E.N.D. account, such as your savings, spending, goals, portfolio, transactions, security, and where to do those tasks in this website.",
    navigationTarget: navigationTarget || "/dashboard",
    navigationLabel: navigationTarget
      ? "Open relevant page"
      : "Open dashboard",
  };
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("At least one chat message is required");
  }

  return messages
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim()
    )
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
}

function pickProvider(requestedProvider) {
  if (requestedProvider === "openai" || requestedProvider === "gemini") {
    return requestedProvider;
  }

  return process.env.AI_CHAT_PROVIDER || "openai";
}

async function chatWithOpenAI(messages, contextBlock) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_CHAT_MODEL || "gpt-5-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text:
                "You are L.E.G.E.N.D.'s financial insights assistant. Only answer about this user's own account, their finances, their security state, and how to navigate this website for those tasks. Do not answer broad world questions, news, politics, sports, weather, entertainment, or general knowledge. If a request is outside the provided user context, refuse briefly and redirect them back to their own account. If the user is asking where to do something in the website, include the most relevant page path from this set: /dashboard, /portfolio, /invest, /goals, /insights, /actions, /security, /contacts, /settings, /twin. Do not claim to execute transactions. Mention when guidance depends on incomplete data.\n\nUser account context:\n" +
                contextBlock,
            },
          ],
        },
        ...messages.map((message) => ({
          role: message.role,
          content: [{ type: "input_text", text: message.content }],
        })),
      ],
      text: {
        format: {
          type: "text",
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI chat request failed");
  }

  const text =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      ?.find((item) => item.type === "output_text")
      ?.text;

  if (!text) {
    throw new Error("OpenAI did not return any chat text");
  }

  return {
    provider: "openai",
    model,
    reply: text,
  };
}

async function chatWithGemini(messages, contextBlock) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are L.E.G.E.N.D.'s financial insights assistant. Only answer about this user's own account, their finances, their security state, and how to navigate this website for those tasks. Do not answer broad world questions, news, politics, sports, weather, entertainment, or general knowledge. If a request is outside the provided user context, refuse briefly and redirect them back to their own account. If the user is asking where to do something in the website, include the most relevant page path from this set: /dashboard, /portfolio, /invest, /goals, /insights, /actions, /security, /contacts, /settings, /twin. Do not claim to execute transactions. Mention when guidance depends on incomplete data.\n\nUser account context:\n" +
                contextBlock,
            },
          ],
        },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini chat request failed");
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini did not return any chat text");
  }

  return {
    provider: "gemini",
    model,
    reply: text,
  };
}

async function chatWithAssistant({ userId, provider, messages }) {
  const financial = await FinancialData.findOne({ userId });
  const goals = await Goal.find({ userId });
  const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10);

  if (!financial) {
    throw new Error("No financial data available for chat");
  }

  const normalizedMessages = normalizeMessages(messages);
  const latestUserMessage = [...normalizedMessages]
    .reverse()
    .find((message) => message.role === "user")?.content;

  if (!latestUserMessage) {
    throw new Error("A user chat message is required");
  }

  if (!isInUserOnlyScope(latestUserMessage)) {
    return buildScopeRefusal(latestUserMessage);
  }

  const insightPayload = await generateInsights(userId);
  const contextBlock = buildChatContext(financial, goals, transactions, insightPayload);
  const resolvedProvider = pickProvider(provider);
  const navigationTarget = detectNavigationTarget(latestUserMessage);

  const response =
    resolvedProvider === "gemini"
      ? await chatWithGemini(normalizedMessages, contextBlock)
      : await chatWithOpenAI(normalizedMessages, contextBlock);

  return {
    ...response,
    navigationTarget,
    navigationLabel: navigationTarget ? "Open suggested page" : null,
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

module.exports = { generateInsights, simulateGoalCompletion, chatWithAssistant };
