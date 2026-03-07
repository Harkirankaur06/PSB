const riskLogs = [];

function addRiskLog(entry) {
  riskLogs.push({
    ...entry,
    timestamp: new Date()
  });
}

function getRiskLogs(userId) {
  return riskLogs.filter(log => log.userId === userId);
}

module.exports = { addRiskLog, getRiskLogs };