const express = require("express");
const protect = require("../middleware/auth.middleware");
const controller = require("../controllers/bank.controller");
const { createRateLimiter } = require("../middleware/rate-limit.middleware");

const router = express.Router();
const bankLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30, keyPrefix: "bank" });
const transferLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 8,
  keyPrefix: "bank-transfer",
});

router.use(protect, bankLimiter);

router.get("/account", controller.getAccount);
router.get("/transactions", controller.getTransactions);
router.post("/transfer/preview", transferLimiter, controller.previewTransfer);
router.post("/transfer", transferLimiter, controller.createTransfer);
router.post("/verify-otp", transferLimiter, controller.verifyOtp);
router.get("/risk-score", controller.getRiskScore);
router.post("/freeze", transferLimiter, controller.setFreeze);

module.exports = router;
