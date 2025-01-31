const express = require("express");
const router = express.Router();
const distributorApplicationController = require("../controllers/distributorApplicationController");

// Route to submit a new distributor application (Prevents duplicate submission)
router.post("/apply", distributorApplicationController.submitApplication);

// Route to check if a user has already applied
router.get("/check-application-status", distributorApplicationController.checkApplicationStatus);

module.exports = router;
