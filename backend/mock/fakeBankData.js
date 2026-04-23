function hashSeed(input) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seedInput) {
  let seed = hashSeed(String(seedInput));

  return () => {
    seed = (1664525 * seed + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function padDigits(value, length) {
  return String(value).padStart(length, "0");
}

const BRANCHES = [
  { city: "Mumbai", ifscSuffix: "1021" },
  { city: "Delhi", ifscSuffix: "2044" },
  { city: "Bengaluru", ifscSuffix: "3188" },
  { city: "Chandigarh", ifscSuffix: "4112" },
  { city: "Hyderabad", ifscSuffix: "5270" },
];

const TRANSACTION_TEMPLATES = [
  { direction: "debit", category: "Food", label: "Urban Spoon Bistro", type: "transfer" },
  { direction: "debit", category: "Travel", label: "Metro Transit Card", type: "transfer" },
  { direction: "debit", category: "Bills", label: "NorthGrid Electricity", type: "transfer" },
  { direction: "debit", category: "Shopping", label: "MarketSquare", type: "transfer" },
  { direction: "credit", category: "Salary", label: "Acme Payroll", type: "transfer" },
  { direction: "credit", category: "Refund", label: "Merchant Refund", type: "transfer" },
  { direction: "debit", category: "Investment", label: "Bluechip SIP AutoPay", type: "sip" },
  { direction: "debit", category: "Investment", label: "Index Growth Basket", type: "invest" },
  { direction: "debit", category: "Portfolio", label: "Asset Rebalance Engine", type: "rebalance" },
  { direction: "debit", category: "Insurance", label: "CareShield Premium", type: "transfer" },
];

function generateBankIdentity(user) {
  const random = createSeededRandom(`${user._id}-bank-profile`);
  const branch = pick(random, BRANCHES);
  const accountSuffix = randomInt(random, 1000, 9999);
  const baseNumber = `${randomInt(random, 10, 99)}${randomInt(random, 1000, 9999)}${randomInt(
    random,
    1000,
    9999
  )}`;
  const accountNumber = `${baseNumber}${accountSuffix}`;

  return {
    bankName: "Punjab & Sind Digital Bank",
    accountType: pick(random, ["Savings", "Salary"]),
    branchName: `${branch.city} Digital Branch`,
    ifsc: `PSIB0${branch.ifscSuffix}`,
    accountNumber,
    maskedAccountNumber: `XXXXXX${accountNumber.slice(-4)}`,
  };
}

function generateFinancialSnapshot(user) {
  const random = createSeededRandom(`${user._id}-financials`);
  const income = randomInt(random, 45000, 180000);
  const expenses = Math.round(income * (0.48 + random() * 0.22));
  const savings = randomInt(random, expenses * 2, expenses * 8);
  const investments = randomInt(random, income * 2, income * 12);
  const assets = randomInt(random, income, income * 8);

  return {
    userId: user._id,
    income,
    expenses,
    savings,
    assets,
    investments,
  };
}

function buildTransactionStatus(random, riskScore) {
  if (riskScore >= 85) return { status: "blocked", decision: "block" };
  if (riskScore >= 60) return { status: "warning", decision: "warn" };
  if (random() < 0.12) return { status: "pending", decision: "allow" };
  return { status: "completed", decision: "allow" };
}

function generateSeededTransactions({ user, financial, count = 24 }) {
  const random = createSeededRandom(`${user._id}-transactions`);
  const now = Date.now();
  const transactions = [];

  for (let index = 0; index < count; index += 1) {
    const template = pick(random, TRANSACTION_TEMPLATES);
    const isInvestment = template.category === "Investment" || template.category === "Portfolio";
    const amount = isInvestment
      ? randomInt(random, 2500, 35000)
      : template.direction === "credit"
        ? randomInt(random, 1500, Math.max(3000, financial.income))
        : randomInt(random, 300, 18000);
    const riskScore =
      template.direction === "credit"
        ? randomInt(random, 4, 22)
        : randomInt(random, 8, isInvestment ? 55 : 72);
    const statusInfo = buildTransactionStatus(random, riskScore);
    const createdAt = new Date(now - randomInt(random, 1, 45) * 24 * 60 * 60 * 1000 - index * 3600000);

    transactions.push({
      userId: user._id,
      type: template.type,
      amount,
      status: statusInfo.status,
      decision: statusInfo.decision,
      riskScore,
      metadata: {
        name: template.label,
        category: template.category,
        direction: template.direction,
        channel: pick(random, ["UPI", "NEFT", "Card", "Auto-Debit", "Internal"]),
        merchantCity: pick(random, ["Mumbai", "Delhi", "Bengaluru", "Pune", "Jaipur"]),
        accountNumberMasked: generateBankIdentity(user).maskedAccountNumber,
      },
      createdAt,
      updatedAt: createdAt,
    });
  }

  return transactions.sort((a, b) => a.createdAt - b.createdAt);
}

module.exports = {
  createSeededRandom,
  generateBankIdentity,
  generateFinancialSnapshot,
  generateSeededTransactions,
  randomInt,
  pick,
  padDigits,
};
