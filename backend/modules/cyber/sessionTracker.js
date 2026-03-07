const sessions = new Map(); // userId -> loginTime

function startSession(userId) {
  sessions.set(userId, Date.now());
}

function getSessionDuration(userId) {
  const start = sessions.get(userId);
  if (!start) return 0;
  return (Date.now() - start) / 1000;
}

module.exports = { startSession, getSessionDuration };