const RiskLog = require("../models/RiskLog");
const Transaction = require("../models/Transaction");

async function getRiskDashboard(user) {

  // 1️⃣ Get last 10 risk logs
  const recentLogs = await RiskLog.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(10);

  // 2️⃣ Count decisions
  const totalBlocked = await Transaction.countDocuments({
    userId: user._id,
    status: "blocked"
  });

  const totalWarned = await Transaction.countDocuments({
    userId: user._id,
    status: "warning"
  });

  const totalAllowed = await Transaction.countDocuments({
    userId: user._id,
    status: "completed"
  });

  // 3️⃣ Calculate Protection Score (Dynamic)
  let protectionScore = user.trustScore;

  if (totalBlocked > 5) protectionScore -= 20;
  if (totalWarned > 5) protectionScore -= 10;

  if (protectionScore < 0) protectionScore = 0;
  if (protectionScore > 100) protectionScore = 100;

  return {
    protectionScore,
    trustScore: user.trustScore,
    summary: {
      totalBlocked,
      totalWarned,
      totalAllowed
    },
    recentAlerts: recentLogs
  };
}

module.exports = { getRiskDashboard };