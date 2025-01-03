const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
});

const UserSchema = new mongoose.Schema(
{
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  date:{
    type:Date,
    default:Date.now,
  },
  cart: [CartItemSchema],
},
{
  collection: "User",
}
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
