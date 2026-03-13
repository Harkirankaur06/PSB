const router = require("express").Router();
const controller = require("../controllers/security.controller");
const protect = require("../middleware/auth.middleware");

router.post("/create-pin", protect, controller.createPin);
router.post("/verify-pin", protect, controller.verifyPin);
router.post("/enable-biometric", protect, controller.enableBiometric);

module.exports = router;