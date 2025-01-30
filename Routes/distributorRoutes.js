const express = require("express");
const router = express.Router();
const distributorController = require("../controllers/distributorController");
const distributorAuth = require("../middleware/distributorAuth"); // Optional middleware for protected routes

// Distributor Signup
router.post("/signup", distributorController.signup);

// Distributor Login
router.post("/login", distributorController.login);

// Fetch Inventory (Protected)
router.get("/inventory", distributorAuth, distributorController.getInventory);

module.exports = router;
