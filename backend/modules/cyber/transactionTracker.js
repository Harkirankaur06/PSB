// transactionTracker.js

const transactionHistory = new Map();

/*
Tracks how many transactions a user performs in a time window
Used for TRANSACTION_VELOCITY signal
*/

function recordTransaction(userId) {
  const now = Date.now();

  if (!transactionHistory.has(userId)) {
    transactionHistory.set(userId, []);
  }

  const history = transactionHistory.get(userId);

  history.push(now);

  // keep only last 60 seconds
  const oneMinuteAgo = now - 60000;
  const filtered = history.filter(t => t > oneMinuteAgo);

  transactionHistory.set(userId, filtered);

  return filtered.length;
}

function checkVelocity(userId) {
  const history = transactionHistory.get(userId) || [];
  return history.length >= 3;
}

module.exports = {
  recordTransaction,
  checkVelocity
};