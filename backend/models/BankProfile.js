const mongoose = require("mongoose");

const bankProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      default: "Savings",
    },
    branchName: {
      type: String,
      required: true,
    },
    ifsc: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "frozen"],
      default: "active",
    },
    simulatedOtpHash: String,
    simulatedOtpExpiresAt: Date,
    pendingTransfer: {
      transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
      amount: Number,
      beneficiaryName: String,
      beneficiaryAccount: String,
      ifsc: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankProfile", bankProfileSchema);
