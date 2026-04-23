const mongoose = require("mongoose");

const userBankConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DummyBankDataset",
      required: true,
    },
    alias: {
      type: String,
      default: "",
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userBankConnectionSchema.index({ userId: 1, datasetId: 1 }, { unique: true });

module.exports = mongoose.model("UserBankConnection", userBankConnectionSchema);
