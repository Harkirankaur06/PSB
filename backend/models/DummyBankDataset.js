const mongoose = require("mongoose");

const dummyTransactionSchema = new mongoose.Schema(
  {
    externalId: String,
    type: {
      type: String,
      enum: ["transfer", "sip", "invest", "rebalance"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "blocked", "warning"],
      default: "completed",
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    decision: {
      type: String,
      enum: ["allow", "warn", "block"],
      default: "allow",
    },
    bookedAt: {
      type: Date,
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { _id: false }
);

const dummyBankDatasetSchema = new mongoose.Schema(
  {
    bankCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    holderName: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      default: "Savings",
    },
    ifsc: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    profile: {
      monthlyIncome: {
        type: Number,
        default: 0,
      },
      monthlyExpenses: {
        type: Number,
        default: 0,
      },
      savingsBalance: {
        type: Number,
        default: 0,
      },
      investmentValue: {
        type: Number,
        default: 0,
      },
      assetValue: {
        type: Number,
        default: 0,
      },
    },
    transactions: {
      type: [dummyTransactionSchema],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DummyBankDataset", dummyBankDatasetSchema);
