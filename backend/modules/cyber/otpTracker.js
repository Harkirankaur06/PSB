const otpAttempts = new Map(); // userId -> attempts

function recordAttempt(userId) {
  const count = otpAttempts.get(userId) || 0;
  otpAttempts.set(userId, count + 1);
}

function getAttempts(userId) {
  return otpAttempts.get(userId) || 0;
}

function resetAttempts(userId) {
  otpAttempts.delete(userId);
}

module.exports = { recordAttempt, getAttempts, resetAttempts };