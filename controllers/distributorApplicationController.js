
const Distributor = require("../models/DistribtorApplication");

// Submit a new distributor application (Prevents duplicate submission)
exports.submitApplication = async (req, res) => {
  try {
    const { firstName, lastName, mobile, email, state, city, propertyType, businessDetail, distributorId } = req.body;

    // Check if distributor exists
    const distributor = await Distributor.findById(distributorId);
    if (!distributor) return res.status(400).json({ message: "Distributor not found" });

    // Check if application already exists
    const existingApplication = await DistributorApplication.findOne({ email });
    if (existingApplication) return res.status(400).json({ message: "You have already applied for the distributorship." });

    // Create a new application
    const application = new DistributorApplication({
      distributor: distributor._id,
      firstName,
      lastName,
      mobile,
      email,
      state,
      city,
      propertyType,
      businessDetail,
    });

    await application.save();
    res.status(201).json({ message: "Application submitted successfully!", application });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ message: "Error submitting application", error });
  }
};

// Check if a user has already applied
exports.checkApplicationStatus = async (req, res) => {
  const { email } = req.query;
  try {
    const application = await DistributorApplication.findOne({ email });
    if (application) {
      return res.json({ applied: true, status: application.status });
    } else {
      return res.json({ applied: false });
    }
  } catch (error) {
    console.error("Error checking application status:", error);
    res.status(500).json({ message: "Server error" });
  }
};
