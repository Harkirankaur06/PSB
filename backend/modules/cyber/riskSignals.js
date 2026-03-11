// riskSignals.js

function detectRiskSignals(data) {
  const signals = [];

  const {
    deviceId,
    knownDevices = [],
    amount = 0,
    avgAmount = 0,
    loginTime,
    transactionTime,
    otpRetries = 0,
    isFirstTimeAction = false,
    transactionsLastMinute = 0,
    beneficiaryId,
    savedBeneficiaries = [],
    location,
    lastLocation
  } = data;

  // 1️⃣ NEW DEVICE
  if (!knownDevices.includes(deviceId)) {
    signals.push("NEW_DEVICE");
  }

  // 2️⃣ LARGE TRANSACTION
  if (avgAmount > 0 && amount > avgAmount * 2) {
    signals.push("LARGE_TRANSACTION");
  }

  // 3️⃣ EXTREME AMOUNT SPIKE
  if (avgAmount > 0 && amount > avgAmount * 5) {
    signals.push("EXTREME_AMOUNT_SPIKE");
  }

  // 4️⃣ FAST TRANSACTION AFTER LOGIN
  if (loginTime && transactionTime) {
    const login = new Date(loginTime);
    const txn = new Date(transactionTime);

    const diffSeconds = (txn - login) / 1000;

    if (diffSeconds < 10) {
      signals.push("FAST_TRANSACTION");
    }
  }

  // 5️⃣ OTP RETRIES
  if (otpRetries > 2) {
    signals.push("OTP_RETRIES");
  }

  // 6️⃣ FIRST TIME ACTION
  if (isFirstTimeAction) {
    signals.push("FIRST_TIME_ACTION");
  }

  // 7️⃣ LATE NIGHT ACTIVITY
  if (transactionTime) {
    const hour = new Date(transactionTime).getHours();

    if (hour >= 0 && hour <= 4) {
      signals.push("LATE_NIGHT_ACTIVITY");
    }
  }

  // 8️⃣ TRANSACTION VELOCITY
  if (transactionsLastMinute > 3) {
    signals.push("TRANSACTION_VELOCITY");
  }

  // 9️⃣ NEW BENEFICIARY
  if (beneficiaryId && !savedBeneficiaries.includes(beneficiaryId)) {
    signals.push("NEW_BENEFICIARY");
  }

  // 🔟 LOCATION CHANGE
  if (location && lastLocation && location !== lastLocation) {
    signals.push("LOCATION_CHANGE");
  }

  // ⭐ META SIGNAL: SOCIAL ENGINEERING PATTERN
  if (
    signals.includes("FAST_TRANSACTION") &&
    signals.includes("LARGE_TRANSACTION") &&
    signals.includes("NEW_DEVICE")
  ) {
    signals.push("SOCIAL_ENGINEERING_PATTERN");
  }

  return signals;
}

module.exports = detectRiskSignals;