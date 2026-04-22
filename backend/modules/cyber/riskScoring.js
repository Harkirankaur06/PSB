const signalScores = {
  NEW_DEVICE: 25,
  LARGE_TRANSACTION: 30,
  EXTREME_AMOUNT_SPIKE: 40,
  FAST_TRANSACTION: 20,
  OTP_RETRIES: 15,
  FIRST_TIME_ACTION: 10,
  LATE_NIGHT_ACTIVITY: 10,
  TRANSACTION_VELOCITY: 20,
  NEW_BENEFICIARY: 20,
  LOCATION_CHANGE: 25,
  SOCIAL_ENGINEERING_PATTERN: 40,
  UNIMAGINABLE_HIGH_AMOUNT: 45,
  UNLIKELY_TIME_EXTREME_TRANSACTION: 55,
};

function calculateRiskScore(signals = [], data = {}) {
  let baseScore = 0;

  signals.forEach((signal) => {
    if (signalScores[signal]) {
      baseScore += signalScores[signal];
    }
  });

  let multiplier = 1;

  if (data.avgAmount && data.amount) {
    multiplier = Math.min(data.amount / data.avgAmount, 3);
  }

  const riskScore = Math.round(baseScore * multiplier);

  let riskLevel = "LOW";

  if (riskScore > 80) {
    riskLevel = "HIGH";
  } else if (riskScore > 40) {
    riskLevel = "MEDIUM";
  }

  return {
    signals,
    baseScore,
    multiplier,
    riskScore,
    riskLevel,
  };
}

module.exports = calculateRiskScore;
