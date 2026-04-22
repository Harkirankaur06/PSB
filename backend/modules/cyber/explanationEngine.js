const explanations = {
  NEW_DEVICE: "The transaction was initiated from an unrecognized device.",
  LARGE_TRANSACTION:
    "The transaction amount is significantly higher than your usual spending behavior.",
  EXTREME_AMOUNT_SPIKE:
    "The transaction amount is extremely higher than your normal transaction pattern.",
  FAST_TRANSACTION:
    "The transaction was executed immediately after login which may indicate automated or pressured activity.",
  OTP_RETRIES:
    "Multiple OTP verification attempts were detected during authentication.",
  FIRST_TIME_ACTION:
    "This financial action is being performed for the first time on this account.",
  LATE_NIGHT_ACTIVITY:
    "The transaction occurred during unusual late-night hours.",
  TRANSACTION_VELOCITY:
    "Multiple transactions were attempted within a very short time window.",
  NEW_BENEFICIARY:
    "The transaction is directed to a beneficiary that has not been previously saved.",
  LOCATION_CHANGE:
    "Login activity was detected from a different geographic location.",
  SOCIAL_ENGINEERING_PATTERN:
    "The transaction pattern resembles known scam or social engineering attack behaviors.",
  UNIMAGINABLE_HIGH_AMOUNT:
    "The transaction amount is an unusually large share of the available account balance.",
  UNLIKELY_TIME_EXTREME_TRANSACTION:
    "An extremely large transaction was attempted during a highly unlikely overnight time window.",
  SECURITY_VERIFICATION_REQUIRED:
    "This transaction requires stronger account verification before it can proceed.",
  LARGE_TRANSACTION_AUTH_REQUIRED:
    "Transactions at or above 20% of account balance require both PIN and OTP verification.",
};

function generateExplanation(signals = [], decisionData = {}) {
  const reasons = [];

  signals.forEach((signal) => {
    if (explanations[signal]) {
      reasons.push(explanations[signal]);
    }
  });

  let summary = "";

  if (decisionData.decision === "BLOCK") {
    summary =
      "This transaction was blocked by the Wealth Firewall because multiple high-risk behavioral signals were detected.";
  } else if (decisionData.decision === "WARN") {
    summary =
      "This transaction triggered several unusual behavioral indicators. Additional confirmation is recommended before proceeding.";
  } else {
    summary =
      "No significant fraud indicators were detected. The transaction appears to be safe.";
  }

  return {
    summary,
    detailedReasons: reasons,
  };
}

module.exports = generateExplanation;
