const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["transfer", "sip", "invest", "rebalance"],
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "completed", "blocked", "warning"],
    default: "pending"
  },

  riskScore: {
    type: Number,
    default: 0
  },

  decision: {
    type: String,
    enum: ["allow", "warn", "block"],
  },

  metadata: {
    type: Object
  }

}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);