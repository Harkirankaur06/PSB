const FinancialData = require("../models/FinancialData");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");
const { classifyIntent } = require("../ai/intentClassifier");
const { buildNavigationGuide, buildActionsForIntent } = require("../ai/toolExecutor");
const { buildFinancialAssistantPrompt } = require("../ai/promptTemplates");

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
    (estimateReturnByType(topType, financialHealthScore, riskyTransactions) / 6).toFixed(2)
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
  const savingsRate = financial.income > 0 ? (financial.savings / financial.income) * 100 : 0;

  if (savingsRate < 20) {
    insights.push("Your savings rate is low. Try to save at least 20% of income.");
  } else {
    insights.push("Good job! Your savings rate is healthy.");
  }

  if (financial.expenses > financial.income * 0.7) {
    insights.push("Your expenses are high. Consider reducing non-essential spending.");
  }

  goals.forEach((goal) => {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
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
  if (!financial) {
    return [
      "User account data is currently unavailable.",
      "Use general financial knowledge and explain clearly.",
      "If the user asks for account-specific advice, state that personal account data is missing and answer with a general framework instead.",
    ].join("\n");
  }

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

const ALLOWED_SCOPE_TERMS = [
  "my",
  "me",
  "mine",
  "account",
  "balance",
  "income",
  "salary",
  "expense",
  "expenses",
  "budget",
  "budgeting",
  "saving",
  "savings",
  "goal",
  "goals",
  "portfolio",
  "asset",
  "allocation",
  "diversification",
  "invest",
  "investment",
  "sip",
  "mutual fund",
  "stock",
  "stocks",
  "stock market",
  "etf",
  "bond",
  "bonds",
  "equity",
  "equities",
  "index fund",
  "index funds",
  "crypto",
  "bitcoin",
  "ethereum",
  "gold",
  "silver",
  "forex",
  "currency",
  "currencies",
  "tax",
  "taxes",
  "insurance",
  "interest rate",
  "interest rates",
  "inflation",
  "deflation",
  "recession",
  "economy",
  "economic",
  "market",
  "markets",
  "gdp",
  "central bank",
  "federal reserve",
  "rbi",
  "returns",
  "compound",
  "compounding",
  "risk",
  "financial planning",
  "retirement",
  "emergency fund",
  "debt",
  "loan",
  "transaction",
  "transactions",
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
  "plan",
  "plans",
  "bank",
  "banks",
];

const BLOCKED_NON_FINANCE_TERMS = [
  "president",
  "prime minister",
  "war",
  "weather",
  "sports",
  "movie",
  "movies",
  "celebrity",
  "who won",
  "actor",
  "singer",
  "cricket",
  "football",
  "ipl",
  "nba",
  "recipe",
  "travel",
  "dating",
];

function isInFinanceScope(text) {
  const lower = text.toLowerCase();
  const hasAllowedSignal = ALLOWED_SCOPE_TERMS.some((term) => lower.includes(term));
  const hasBlockedSignal = BLOCKED_NON_FINANCE_TERMS.some((term) => lower.includes(term));

  if (hasBlockedSignal && !hasAllowedSignal) {
    return false;
  }

  return hasAllowedSignal;
}

function buildScopeRefusal(text) {
  const classified = classifyIntent(text);
  const navigationTarget = classified.routeTarget?.path;

  return {
    provider: "scope-guard",
    model: "local",
    intent: "OUT_OF_SCOPE",
    reply:
      "I can help with personal finance, investing, risk, banking, and how to use L.E.G.E.N.D., but not unrelated topics like politics, sports, entertainment, or general news.",
    actions: [
      {
        type: "NAVIGATE",
        target: navigationTarget || "/dashboard",
        label: navigationTarget ? "Open relevant page" : "Open dashboard",
        requiresConfirmation: false,
      },
    ],
    guideSteps: navigationTarget ? buildNavigationGuide(classified.routeTarget) : [],
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

async function chatWithOpenAI(messages, contextBlock, intent, currentPage) {
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
              text: buildFinancialAssistantPrompt(contextBlock, intent, currentPage),
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
    data.output?.flatMap((item) => item.content || [])?.find((item) => item.type === "output_text")
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

async function chatWithGemini(messages, contextBlock, intent, currentPage) {
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
              text: buildFinancialAssistantPrompt(contextBlock, intent, currentPage),
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

function buildLocalFinancialReply({ financial, goals, insightPayload, latestUserMessage }) {
  const lower = latestUserMessage.toLowerCase();
  const recommendations = insightPayload?.recommendations || [];

  if (!financial) {
    if (
      lower.includes("investment") ||
      lower.includes("invest") ||
      lower.includes("stock") ||
      lower.includes("mutual fund") ||
      lower.includes("sip") ||
      lower.includes("etf")
    ) {
      return "A strong default investing approach is to first build an emergency fund, then invest regularly through diversified long-term instruments such as broad funds, and only take concentrated bets when you understand the downside. If you want, ask me beginner, moderate, or advanced and I can tailor the explanation.";
    }

    if (
      lower.includes("budget") ||
      lower.includes("saving") ||
      lower.includes("savings") ||
      lower.includes("emergency fund")
    ) {
      return "A practical money foundation is: cover essentials, keep debt manageable, build an emergency fund, and automate savings before increasing investment risk. I can help you turn that into a step-by-step plan too.";
    }

    return "I can answer general finance and investment questions even without your account data. For account-specific advice, connect your finances so I can tailor the answer to your numbers.";
  }

  if (
    lower.includes("investment") ||
    lower.includes("invest") ||
    lower.includes("sip") ||
    lower.includes("mutual fund") ||
    lower.includes("portfolio")
  ) {
    const ratio = financial.income > 0 ? (financial.investments / financial.income) * 100 : 0;
    const topRecommendation =
      recommendations.find((item) => item.toLowerCase().includes("sip")) ||
      recommendations[0] ||
      "Stay diversified and avoid concentrating too much into one move at once.";

    return `Your current investment base is ${financial.investments || 0}, which is about ${ratio.toFixed(
      1
    )}% of monthly income. In general, a sensible progression is: build an emergency fund first, invest consistently through diversified instruments, and increase risk only when your cash flow is stable. Based on your profile, the next sensible move is: ${topRecommendation}`;
  }

  if (lower.includes("saving") || lower.includes("savings")) {
    return `Your current savings are ${financial.savings || 0}, and your savings rate is ${
      insightPayload.summary?.savingsRate ?? 0
    }%. ${insightPayload.insights?.[0] || "Your saving pattern looks stable right now."}`;
  }

  if (lower.includes("goal")) {
    return goals.length > 0
      ? `You have ${goals.length} active goals. The slower goals need extra contributions first, so review the Goals page and adjust your monthly plan.`
      : "You do not have active goals yet. Creating one would help tailor your investment planning better.";
  }

  return (
    insightPayload.portfolioAssistant?.headline ||
    recommendations[0] ||
    "Your account looks ready for a focused review of savings, spending, and investment posture."
  );
}

async function chatWithAssistant({ userId, provider, messages, currentPage = null }) {
  const normalizedMessages = normalizeMessages(messages);
  const latestUserMessage = [...normalizedMessages]
    .reverse()
    .find((message) => message.role === "user")?.content;

  if (!latestUserMessage) {
    throw new Error("A user chat message is required");
  }

  const classification = classifyIntent(latestUserMessage);

  if (!isInFinanceScope(latestUserMessage)) {
    return buildScopeRefusal(latestUserMessage);
  }

  if (classification.intent === "NAVIGATE" && classification.routeTarget) {
    return {
      provider: "scope-guard",
      model: "local",
      intent: "NAVIGATE",
      reply: `The best page for that in L.E.G.E.N.D. is ${classification.routeTarget.path}.`,
      actions: buildActionsForIntent(classification.intent, classification.routeTarget),
      guideSteps: buildNavigationGuide(classification.routeTarget),
    };
  }

  const financial = await FinancialData.findOne({ userId });
  const goals = await Goal.find({ userId });
  const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10);
  const insightPayload = financial
    ? await generateInsights(userId)
    : { insights: [], recommendations: [], summary: {}, portfolioAssistant: null };
  const contextBlock = buildChatContext(financial, goals, transactions, insightPayload);
  const resolvedProvider = pickProvider(provider);
  const actions =
    classification.intent === "NAVIGATE" ||
    classification.intent === "ACTION" ||
    classification.intent === "RISK_ALERT"
      ? buildActionsForIntent(classification.intent, classification.routeTarget)
      : [];
  const guideSteps =
    (classification.intent === "ACTION" || classification.intent === "RISK_ALERT") &&
    classification.routeTarget
      ? buildNavigationGuide(classification.routeTarget)
      : [];

  let response;

  try {
    response =
      resolvedProvider === "gemini"
        ? await chatWithGemini(normalizedMessages, contextBlock, classification.intent, currentPage)
        : await chatWithOpenAI(normalizedMessages, contextBlock, classification.intent, currentPage);
  } catch (error) {
    response = {
      provider: "local-fallback",
      model: "heuristic",
      reply: buildLocalFinancialReply({
        financial,
        goals,
        insightPayload,
        latestUserMessage,
      }),
    };
  }

  return {
    ...response,
    intent: classification.intent,
    actions,
    guideSteps,
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
    estimatedCompletion: completionDate,
  };
}

module.exports = { generateInsights, simulateGoalCompletion, chatWithAssistant };
