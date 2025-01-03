const mongoose = require("mongoose");

// Define the CartItem schema
const cartItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  selectedColor: {
    type: String,
    required: true,
  },
  selectedBattery: {
     type: String,
     default:"Gaphine 32Ah",
  
    },  // This field is required
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

// Define the User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  
  cartData: [cartItemSchema], // Use CartItem schema in an array
  date: {
    type: Date,
    default: Date.now,
  },
});

// Define the User model
const User = mongoose.model("User", userSchema, "Users");

module.exports = User;
