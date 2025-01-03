const express = require("express");
const { placeOrderRazorpay, confirmRazorpayPayment } = require('../controllers/OrderController');
const jwt = require("jsonwebtoken");
const UserSchema = require("../models/UserSchema.js"); // Adjust the path as needed
const OrderSchema = require("../models/OrderModal.js"); // Define your Order model
require("dotenv").config();
const qs = require('qs');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
// Add CORS Middleware


const secretKey = process.env.JWT_SECRET;
const router = express.Router();

// Middleware to verify the JWT token and fetch the user
const fetchUser = async (req, res, next) => {
  console.log("Fetch error");
  const token = req.headers["authorization"]?.split(" ")[1]; // Extract token from Authorization header
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // Decode and verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);  // Debugging token decoding

    // Fetch user from the database using the correct field 'Id'
    const user = await UserSchema.findById(decoded.user.Id); // Use decoded.user.Id instead of decoded.user.id
    console.log("Fetched User:", user);  // Debugging the fetched user

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach the user to the request object
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Controller Function to place a new order using Razorpay
// This was already defined in the previous controller code
// const placeOrderRazorpay = require('../controllers/OrderController');

// Function to generate the hash for Easebuzz
















// Routes
router.post("/place", fetchUser, async (req, res) => {
  try {
    const { items, amount, address, paymentMethod, payment } = req.body;

    // Create and save the new order
    const newOrder = new OrderSchema({
      user: req.user._id, // Fetch user from middleware
      items,
      amount,
      
      address,
      paymentMethod: 'cod',
      payment,
      status: "pending", // Default order status
    });

    await newOrder.save();
    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error placing order:", error.message);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
});








// Environment variables (put these in a `.env` file)
const { EASEBUZZ_KEY, EASEBUZZ_BASE_URL,EASEBUZZ_SALT} = process.env;

const generateHash = (data) => {
  const hashString = `${data.key}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|||||||||||${EASEBUZZ_SALT}`;
  console.log("Hash String:", hashString);
  return crypto.createHash('sha512').update(hashString).digest('hex');
};

// Route to initialize Easebuzz payment
router.post('/easebuzz/initiate', fetchUser, async (req, res) => {
  try {
    const { amount, firstname, email, phone, productinfo } = req.body;

    if (!amount || !firstname || !email || !phone || !productinfo) {
      return res.status(400).json({ success: false, message: 'Invalid input data.' });
    }

    const txnid = `TXN${Date.now()}`;
    const data = {
      key: EASEBUZZ_KEY,
      txnid,
      amount: parseFloat(amount).toFixed(2),
      productinfo: productinfo.trim(),
      firstname: firstname.trim(),
      email: email.trim(),
      phone: phone.trim(),
      surl: `http://localhost:4900/success`,
      furl: `http://localhost:4900/success`,
    };

    console.log('Request Data:', data);
 

    // Generate hash
    const hash = generateHash(data);
    data.hash = hash;

    console.log('Hash String:', hash);

    const easebuzzUrl = `${EASEBUZZ_BASE_URL}/payment/initiateLink`;

    const response = await axios.post(easebuzzUrl, qs.stringify(data), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    console.log('Easebuzz Response:', response.data);

    if (response.data.status === 1) {
      const paymentToken = response.data.data;
      if (!paymentToken) {
        console.error('Payment token is undefined');
        res.status(500).json({ success: false, message: 'Payment token missing in Easebuzz response.' });
        return;
      }

      // Store order details in the database

      // Construct the payment URL
      const paymentUrl = `https://testpay.easebuzz.in/pay/${paymentToken}`;

      // for production
      // const paymentUrl = `https://pay.easebuzz.in/pay/${paymentToken}`;

      // send to database
      res.json({ success: true, paymentUrl });
      // Save the order in the database



      const { items, amount, address, paymentMethod, payment } = req.body;

      // Save the order to the database
      const newOrder = new OrderSchema({
        user: req.user._id, // Fetch user from middleware
        items,
        amount,
        // selectedBattery,
        txnid,
        address,
        status: "pending",
        paymentMethod: "easebuzz",
        payment: "easebuzz",
      });

      await newOrder.save();

      // Update the order status to 'completed'
      await OrderSchema.findOneAndUpdate({ txnid }, { status: 'completed' });



    } else {
      console.error('Easebuzz error:', response.data.error_desc);
      res.status(400).json({ success: false, message: response.data.error_desc });
    }

  } catch (error) {
    console.error('Error initiating Easebuzz payment:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to initiate payment.' });
  }

});

// Success route



// Success callback route
// Success callback route
router.get("/success", async (req, res) => {
  try {
    const { txnid, status } = req.body;

    if (status === "success") {
    
      return res.json({ success: true, message: "Payment successful! Order has been placed." });
    } else {
      return res.json({ success: false, message: "Payment failed. Please try again." });
    }
  } catch (error) {
    console.error("Error handling success callback:", error.message);
    return res.status(500).json({ success: false, message: "Error processing payment success callback." });
  }
});

// Failure callback route
router.get("/failed", async (req, res) => {
  try {
    const { txnid } = req.body;

    await OrderSchema.findOneAndUpdate({ txnid }, { status: "failed" });
    return res.json({ success: false, message: "Payment failed. Please try again." });
  } catch (error) {
    console.error("Error handling failure callback:", error.message);
    return res.status(500).json({ success: false, message: "Error processing payment failure callback." });
  }
});










router.post("/razorpay", fetchUser, placeOrderRazorpay); // Place a new Razorpay order (protected route)
router.post("/confirm/razorpay", fetchUser, confirmRazorpayPayment); // Place a new Razorpay order (protected route)


















router.get("/user-orders", fetchUser, async (req, res) => {
  try {
    // Fetch orders belonging to the authenticated user
    const userOrders = await OrderSchema.find({ user: req.user._id }).sort({ createdAt: -1 });

    if (!userOrders.length) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for this user',
      });
    }

    res.status(200).json({
      success: true,
      orders: userOrders,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

// router.get("/:orderId", fetchUser, async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     // Validate `orderId` is a valid ObjectId
//     if (!mongoose.Types.ObjectId.isValid(orderId)) {
//       return res.status(400).json({ success: false, message: 'Invalid Order ID.' });
//     }

//     // Fetch the order belonging to the logged-in user
//     const order = await OrderSchema.findOne({
//       _id: orderId,
//       user: req.user._id,
//     });

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found.' });
//     }

//     res.status(200).json({ success: true, order });
//   } catch (error) {
//     console.error('Error fetching order by ID:', error.message);
//     res.status(500).json({ success: false, message: 'Error fetching order details.' });
//   }
// });






router.get("/all-orders", fetchUser, async (req, res) => {
  try {

    const userOrders = await OrderSchema.find();

    if (!userOrders.length) {
      return res.status(404).json({
        success: false,

      });
    }

    res.status(200).json({
      success: true,
      orders: userOrders,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

// Uncomment below if you want to add a route for Stripe as well
// router.post("/place/stripe", fetchUser, placeOrderStripe); 

module.exports = router;
