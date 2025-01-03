const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js"); 

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      email,
      password: hashedPassword,
      cart: [],
    });

    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, "secret_ecom", { expiresIn: "1h" });

    res.json({ success: true, token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


// ================================================================================================


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, "secret_ecom", { expiresIn: "1h" });

    res.json({ success: true, token, cart: user.cart });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// ==========================================================================================

router.post("/cart", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const itemIndex = user.cart.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      user.cart[itemIndex].quantity += quantity;
    } else {
      user.cart.push({ productId, quantity });
    }

    await user.save();

    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
