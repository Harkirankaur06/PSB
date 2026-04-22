const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    deviceName: String,
    lastUsed: { type: Date, default: Date.now },
    isTrusted: { type: Boolean, default: false },
  },
  { _id: false }
);

const webAuthnCredentialSchema = new mongoose.Schema(
  {
    credentialID: {
      type: String,
      required: true,
    },
    publicKey: {
      type: Buffer,
      required: true,
    },
    counter: {
      type: Number,
      default: 0,
    },
    transports: {
      type: [String],
      default: [],
    },
    deviceType: {
      type: String,
      default: "singleDevice",
    },
    backedUp: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    devices: [deviceSchema],

    riskScore: {
      type: Number,
      default: 0,
    },

    trustScore: {
      type: Number,
      default: 100,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    security: {
      pinHash: String,
      biometricEnabled: {
        type: Boolean,
        default: false,
      },
      webAuthnCredentials: {
        type: [webAuthnCredentialSchema],
        default: [],
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
