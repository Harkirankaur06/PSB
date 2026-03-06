const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const { handleTransaction,getHistory,cancelTransaction } = require("../controllers/transaction.controller");

router.post("/", protect, handleTransaction);
router.post("/transfer", protect, (req, res) =>
  handleTransaction(req, res, "transfer")
);

router.post("/sip", protect, (req, res) =>
  handleTransaction(req, res, "sip")
);

router.post("/invest", protect, (req, res) =>
  handleTransaction(req, res, "invest")
);
router.get("/history", protect, getHistory);
router.post("/:id/cancel", protect, cancelTransaction);

module.exports = router;