const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  deviceName: String,
  lastUsed: { type: Date, default: Date.now },
  isTrusted: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  devices: [deviceSchema],

  riskScore: {
    type: Number,
    default: 0
  },

  trustScore: {
    type: Number,
    default: 100
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);