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
    lastLocation,
    accountBalance = 0,
  } = data;

  if (deviceId && !knownDevices.includes(deviceId)) {
    signals.push("NEW_DEVICE");
  }

  if (avgAmount > 0 && amount > avgAmount * 2) {
    signals.push("LARGE_TRANSACTION");
  }

  if (avgAmount > 0 && amount > avgAmount * 5) {
    signals.push("EXTREME_AMOUNT_SPIKE");
  }

  if (loginTime && transactionTime) {
    const login = new Date(loginTime);
    const txn = new Date(transactionTime);
    const diffSeconds = (txn - login) / 1000;

    if (diffSeconds < 10) {
      signals.push("FAST_TRANSACTION");
    }
  }

  if (otpRetries > 2) {
    signals.push("OTP_RETRIES");
  }

  if (isFirstTimeAction) {
    signals.push("FIRST_TIME_ACTION");
  }

  if (transactionTime) {
    const hour = new Date(transactionTime).getHours();

    if (hour >= 0 && hour <= 4) {
      signals.push("LATE_NIGHT_ACTIVITY");
    }
  }

  if (transactionsLastMinute > 3) {
    signals.push("TRANSACTION_VELOCITY");
  }

  if (beneficiaryId && !savedBeneficiaries.includes(beneficiaryId)) {
    signals.push("NEW_BENEFICIARY");
  }

  if (location && lastLocation && location !== lastLocation) {
    signals.push("LOCATION_CHANGE");
  }

  if (accountBalance > 0 && amount >= accountBalance * 0.8) {
    signals.push("UNIMAGINABLE_HIGH_AMOUNT");
  }

  if (accountBalance > 0 && amount >= accountBalance * 0.8 && transactionTime) {
    const hour = new Date(transactionTime).getHours();

    if (hour >= 0 && hour <= 4) {
      signals.push("UNLIKELY_TIME_EXTREME_TRANSACTION");
    }
  }

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
