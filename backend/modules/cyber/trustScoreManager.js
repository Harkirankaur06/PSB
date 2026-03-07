const trustScores = new Map(); // userId -> score

function getTrustScore(userId) {
  return trustScores.get(userId) || 100;
}

function decreaseTrust(userId, points) {
  const current = getTrustScore(userId);
  trustScores.set(userId, Math.max(0, current - points));
}

function increaseTrust(userId, points) {
  const current = getTrustScore(userId);
  trustScores.set(userId, Math.min(100, current + points));
}

module.exports = { getTrustScore, decreaseTrust, increaseTrust };