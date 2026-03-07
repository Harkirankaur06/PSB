// userBehaviorProfile.js

const profiles = new Map();

/*
Stores baseline behaviour for each user
Used for anomaly detection
*/

function updateProfile(userId, transactionAmount) {

  if (!profiles.has(userId)) {
    profiles.set(userId, {
      averageTransaction: transactionAmount,
      transactionCount: 1
    });
    return;
  }

  const profile = profiles.get(userId);

  const total =
    profile.averageTransaction * profile.transactionCount +
    transactionAmount;

  profile.transactionCount += 1;
  profile.averageTransaction = total / profile.transactionCount;

  profiles.set(userId, profile);
}

function getAverageTransaction(userId) {

  const profile = profiles.get(userId);

  if (!profile) return 0;

  return profile.averageTransaction;
}

module.exports = {
  updateProfile,
  getAverageTransaction
};
