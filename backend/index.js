const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const financialRoutes = require("./routes/financial.routes");
const transactionRoutes = require("./routes/transaction.routes");
const riskRoutes = require("./routes/risk.routes");
const goalRoutes = require("./routes/goal.routes");
const securityRoutes = require("./routes/security.routes");

const activityLogger = require("./middleware/activity.middleware");

mongoose.connect("mongodb://127.0.0.1:27017/psb_hackathon");

const app = express();

app.use(cors());   // ✅ simplest working version
app.use(express.json());
app.use(activityLogger);

app.use("/api/auth", authRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/security", securityRoutes);

require("./jobs/transaction.worker");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});