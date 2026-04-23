const express = require("express");
const protect = require("../middleware/auth.middleware");
const controller = require("../controllers/app.controller");

const router = express.Router();

router.get("/overview", protect, controller.getOverview);
router.get("/header", protect, controller.getHeaderData);
router.get("/contacts", protect, controller.getContacts);
router.post("/contacts", protect, controller.createContact);
router.put("/contacts/:id", protect, controller.updateContact);
router.delete("/contacts/:id", protect, controller.deleteContact);
router.get("/security-feed", protect, controller.getSecurityFeed);

module.exports = router;
