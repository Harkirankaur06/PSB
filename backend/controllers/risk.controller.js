const riskService = require("../services/risk.service");

async function getDashboard(req, res) {
  try {
    const dashboard = await riskService.getRiskDashboard(req.user);
    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getDashboard };