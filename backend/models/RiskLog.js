const mongoose = require("mongoose");

const riskLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  action: {
    type: String,
    required: true
  },

  riskScore: {
    type: Number,
    required: true
  },

  decision: {
    type: String,
    enum: ["allow", "warn", "block"],
    required: true
  },

  reason: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("RiskLog", riskLogSchema);