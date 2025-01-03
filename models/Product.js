const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: [String], // Array of strings to handle multiple images
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  bestSeller: {
    type: Boolean,
    required: true,
  },
  colors: {
    type: [String], // Array of strings to handle multiple colors
    required: true,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  tags: {
    type: [String], 
    required: false,
  },
  category: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default:Date.now,
  },
},
{
  collection: "Product",
}
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
