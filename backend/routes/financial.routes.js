const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
  upsertFinancial,
  getFinancial
} = require("../controllers/financial.controller");

router.post("/", protect, upsertFinancial);
router.get("/", protect, getFinancial);
router.put("/", protect, upsertFinancial);

module.exports = router;