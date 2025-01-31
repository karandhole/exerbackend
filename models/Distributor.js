const mongoose = require("mongoose");

const DistributorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  businessName: { type: String, required: true },
  gstNumber: { type: String, required: true },
  address: { type: String, required: true }, 
  phone: { type: String, required: true },
  inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Distributor", DistributorSchema);

