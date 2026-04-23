const aiService = require("../services/ai.service");

async function getInsights(req, res) {
  try {
    const result = await aiService.generateInsights(req.user._id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function simulate(req, res) {
  try {
    const result = aiService.simulateGoalCompletion(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function chat(req, res) {
  try {
    const result = await aiService.chatWithAssistant({
      userId: req.user._id,
      provider: req.body.provider,
      messages: req.body.messages,
      currentPage: req.body.currentPage,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { getInsights, simulate, chat };
