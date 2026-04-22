const { verifyAccessToken } = require("../utils/token.util");
const User = require("../models/User");
const Session = require("../models/Session");

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const deviceId = req.headers["x-device-id"];
    const sessionQuery = { userId: user._id };

    if (deviceId) {
      sessionQuery.deviceId = deviceId;
    }

    let session = await Session.findOne(sessionQuery).sort({ lastActivityAt: -1, createdAt: -1 });

    if (!session && deviceId) {
      session = await Session.findOne({ userId: user._id }).sort({
        lastActivityAt: -1,
        createdAt: -1,
      });
    }

    if (!session) {
      return res.status(401).json({ message: "Session not found" });
    }

    const now = Date.now();

    if (new Date(session.expiresAt).getTime() <= now) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ message: "Session expired" });
    }

    const lastActivityAt = session.lastActivityAt
      ? new Date(session.lastActivityAt).getTime()
      : new Date(session.createdAt).getTime();

    if (now - lastActivityAt > INACTIVITY_LIMIT_MS) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ message: "Logged out after 5 minutes of inactivity" });
    }

    session.lastActivityAt = new Date(now);
    await session.save();

    req.user = user;
    req.session = session;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = protect;
