const mongoose = require("mongoose");

const otpTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["new_device_login", "transaction_verification"],
      required: true,
      default: "new_device_login",
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

otpTokenSchema.index(
  { userId: 1, deviceId: 1, purpose: 1 },
  { unique: true }
);

module.exports = mongoose.model("OtpToken", otpTokenSchema);
