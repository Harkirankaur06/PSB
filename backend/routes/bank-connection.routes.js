const express = require("express");
const protect = require("../middleware/auth.middleware");
const controller = require("../controllers/bank-connection.controller");

const router = express.Router();

router.get("/catalog", controller.getCatalog);
router.get("/connections", protect, controller.getConnections);
router.post("/connections", protect, controller.connectBank);
router.delete("/connections/:id", protect, controller.disconnectBank);

module.exports = router;
