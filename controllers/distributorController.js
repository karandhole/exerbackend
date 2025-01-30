const Distributor = require("../models/Distributor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET; // Replace with a secure key

// Signup Controller
exports.signup = async (req, res) => {
  try {
    const { name, email, password, businessName, gstNumber, address, phone } = req.body;

    const existingDistributor = await Distributor.findOne({ email });
    if (existingDistributor) {
      return res.status(400).json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const distributor = new Distributor({
      name,
      email,
      password: hashedPassword,
      businessName,
      gstNumber,
      address,
      phone,
    });

    await distributor.save();

    const token = jwt.sign({ distributorId: distributor._id }, secretKey, { expiresIn: "1h" });
    res.status(201).json({ success: true, token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Error signing up." });
  }
};

// Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const distributor = await Distributor.findOne({ email });
    if (!distributor) {
      return res.status(400).json({ success: false, message: "Distributor not found." });
    }

    const isMatch = await bcrypt.compare(password, distributor.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials." });
    }

    const token = jwt.sign({ distributorId: distributor._id }, secretKey, { expiresIn: "1h" });
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Error logging in." });
  }
};

// Fetch Inventory Controller
exports.getInventory = async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.distributorId).populate("inventory");
    res.status(200).json({ success: true, inventory: distributor.inventory });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ success: false, message: "Error fetching inventory." });
  }
};
