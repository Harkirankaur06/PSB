const mongoose = require("mongoose");

const financialDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  income: {
    type: Number,
    default: 0
  },

  expenses: {
    type: Number,
    default: 0
  },

  savings: {
    type: Number,
    default: 0
  },

  assets: {
    type: Number,
    default: 0
  },

  investments: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model("FinancialData", financialDataSchema);