const mongoose = require("mongoose");

const trustedContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      default: "Trusted contact",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    permissions: {
      type: [String],
      enum: ["view", "emergency"],
      default: ["view"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrustedContact", trustedContactSchema);
