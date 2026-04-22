const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    refreshToken: {
      type: String,
      required: true,
    },

    deviceId: {
      type: String,
      required: true,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    secondFactorVerified: {
      type: Boolean,
      default: false,
    },

    currentChallenge: {
      type: String,
      default: null,
    },

    currentChallengeType: {
      type: String,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
