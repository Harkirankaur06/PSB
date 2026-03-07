const router = require("express").Router();
const controller = require("../controllers/security.controller");

router.post("/create-pin", controller.createPin);
router.post("/verify-pin", controller.verifyPin);
router.post("/enable-biometric", controller.enableBiometric);

module.exports = router;