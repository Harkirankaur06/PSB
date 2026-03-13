const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth.routes");
const financialRoutes = require("./routes/financial.routes");
const transactionRoutes = require("./routes/transaction.routes");
const riskRoutes = require("./routes/risk.routes");
const goalRoutes = require("./routes/goal.routes");
const activityLogger = require("./middleware/activity.middleware");
const sercuirtyroutes=require("./routes/security.routes");



mongoose.connect("mongodb://127.0.0.1:27017/psb_hackathon");

const app = express();
app.use(express.json());
app.use(activityLogger);

app.use("/api/auth", authRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/security",sercuirtyroutes);


require("./jobs/transaction.worker");
app.listen(5000, () => console.log("Server running on port 5000"));