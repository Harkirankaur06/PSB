const router = require("express").Router();
const controller = require("../controllers/security.controller");
const protect = require("../middleware/auth.middleware");

router.get("/status", protect, controller.getStatus);
router.post("/trust-device", protect, controller.trustDevice);
router.post("/otp/send", protect, controller.sendOtp);
router.post("/otp/verify", protect, controller.verifyOtp);
router.post("/create-pin", protect, controller.createPin);
router.post("/verify-pin", protect, controller.verifyPin);
router.post("/enable-biometric", protect, controller.enableBiometric);
router.post("/webauthn/register/options", protect, controller.getRegistrationOptions);
router.post("/webauthn/register/verify", protect, controller.verifyRegistration);
router.post("/webauthn/authenticate/options", protect, controller.getAuthenticationOptions);
router.post("/webauthn/authenticate/verify", protect, controller.verifyAuthentication);

module.exports = router;
