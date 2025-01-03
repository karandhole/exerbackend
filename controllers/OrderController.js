const Razorpay = require("razorpay");
const crypto = require("crypto");
const axios = require('axios');

const OrderSchema = require("../models/OrderModal.js"); // Adjust the path if necessary

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Place a new order using Razorpay
 */
const placeOrderRazorpay = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    // Create a Razorpay order
    const options = {
      amount: amount * 100, // Amount in paise (multiply by 100)
      currency,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(201).json({
      success: true,
      order: razorpayOrder,
    });
  } catch (error) {
    console.error("Error placing Razorpay order:", error.message);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
};

/**
 * Confirm Razorpay Payment
 */
const confirmRazorpayPayment = async (req, res) => {
  const { paymentId, orderId } = req.body;

  try {
    // Fetch payment details
    const payment = await razorpay.payments.fetch(paymentId);

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (payment && payment.order_id === orderId && generatedSignature === payment.signature) {
      // Payment is verified; update order status in database
      const order = await OrderSchema.findOneAndUpdate(
        { razorpayOrderId: orderId }, // Match the Razorpay order ID
        { paymentStatus: "confirmed" }, // Update the payment status
        { new: true } // Return the updated document
      );

      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      res.status(200).json({
        success: true,
        message: "Payment confirmed successfully!",
        order,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }
  } catch (error) {
    console.error("Error confirming Razorpay payment:", error.message);
    res.status(500).json({ success: false, message: "Error confirming payment" });
  }
};


module.exports = {
  placeOrderRazorpay,
  confirmRazorpayPayment,
 
};
