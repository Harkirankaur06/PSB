const detectRiskSignals = require("./riskSignals");
const calculateRiskScore = require("./riskScoring");
const makeDecision = require("./decisionEngine");
const generateExplanation = require("./explanationEngine");

// Synthetic transaction
const transaction = {
  deviceId: "device123",
  knownDevices: ["device001"],

  amount: 80000,
  avgAmount: 10000,

  loginTime: "2026-03-11T10:00:00",
  transactionTime: "2026-03-11T10:00:05",

  otpRetries: 3,
  isFirstTimeAction: true,

  transactionsLastMinute: 4,

  beneficiaryId: "ben999",
  savedBeneficiaries: ["ben001"],

  location: "Mumbai",
  lastLocation: "Delhi"
};

console.log("\n=== Wealth Firewall Analysis ===");

// 1️⃣ Detect Signals
const signals = detectRiskSignals(transaction);
console.log("\nSignals:", signals);

// 2️⃣ Risk Scoring
const riskResult = calculateRiskScore(signals, transaction);
console.log("\nRisk Result:", riskResult);

// 3️⃣ Decision Engine
const decision = makeDecision(riskResult, signals);
console.log("\nDecision:", decision);

// 4️⃣ Explanation Engine
const explanation = generateExplanation(signals, decision);
console.log("\nExplanation:", explanation);

// 5️⃣ Final Response
const finalResponse = {
  signals,
  ...riskResult,
  ...decision,
  explanation
};

console.log("\nFinal Cyber Response:");
console.log(finalResponse);