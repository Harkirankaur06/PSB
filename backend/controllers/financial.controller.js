const financialService = require("../services/financial.service");

async function upsertFinancial(req, res) {
  try {
    const financial = await financialService.upsertFinancialData(
      req.user._id,
      req.body
    );

    const metrics = financialService.calculateMetrics(financial);

    res.json({
      message: "Financial data saved",
      financial,
      metrics
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getFinancial(req, res) {
  const result = await financialService.getFinancialWithGoals(req.user._id);
  res.json(result);
}

module.exports = {
  upsertFinancial,
  getFinancial
};