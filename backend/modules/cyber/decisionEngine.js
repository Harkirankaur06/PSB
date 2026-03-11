// decisionEngine.js

function makeDecision(riskResult, signals = []) {

  const { riskScore, riskLevel } = riskResult;

  let decision = "ALLOW";
  let action = "EXECUTE_TRANSACTION";
  let coolingTime = 0;
  let fraudFlag = false;

  // HIGH RISK → BLOCK
  if (riskLevel === "HIGH") {

    decision = "BLOCK";
    action = "PREVENT_TRANSACTION";
    fraudFlag = true;

  }

  // MEDIUM RISK → WARN + COOLING TIMER
  else if (riskLevel === "MEDIUM") {

    decision = "WARN";
    action = "DELAY_AND_CONFIRM";
    coolingTime = 30; // seconds

  }

  // LOW RISK → ALLOW
  else {

    decision = "ALLOW";
    action = "EXECUTE_TRANSACTION";

  }

  // Detect extreme fraud scenarios
  if (
    signals.includes("SOCIAL_ENGINEERING_PATTERN") ||
    signals.includes("EXTREME_AMOUNT_SPIKE")
  ) {
    fraudFlag = true;
    decision = "BLOCK";
    action = "PREVENT_TRANSACTION";
  }

  return {
    riskScore,
    riskLevel,
    decision,
    action,
    coolingTime,
    fraudFlag
  };
}

module.exports = makeDecision;