function calculateRisk({ user, transaction, deviceId }) {
  let riskScore = 0;
  let reasons = [];

  // 🚨 High amount check
  if (transaction.amount > 100000) {
    riskScore += 40;
    reasons.push("High transaction amount");
  }

  // 🚨 New device detection
  const device = user.devices.find(d => d.deviceId === deviceId);

  if (!device || !device.isTrusted) {
    riskScore += 30;
    reasons.push("Untrusted or new device");
  }

  // 🚨 Low trust score
  if (user.trustScore < 50) {
    riskScore += 20;
    reasons.push("Low trust score");
  }

  // 🚨 Late night simulation
  const hour = new Date().getHours();
  if (hour >= 0 && hour <= 5) {
    riskScore += 10;
    reasons.push("Unusual time activity");
  }

  let decision = "allow";

  if (riskScore >= 70) decision = "block";
  else if (riskScore >= 40) decision = "warn";

  return { riskScore, decision, reasons };
}

module.exports = { calculateRisk };