const mongoose = require("mongoose");

// Distributor Application Schema
const DistributorApplicationSchema = new mongoose.Schema({
  distributor: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor", required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  propertyType: { type: String, required: true },
  businessDetail: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const DistributorApplication = mongoose.model("DistributorApplication", DistributorApplicationSchema);
module.exports = DistributorApplication;
