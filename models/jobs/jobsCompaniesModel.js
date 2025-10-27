const mongoose = require("mongoose");

const jobsCompanyModel = new mongoose.Schema(
  {
    name: String,
    slug: String,
    email: String,
    phone: String,
    city: String,
    country: String,
    description: String,
    logo: String,
    verified: { type: Boolean, default: false },
    jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    files: {
      type: [
        {
          key: { type: String, required: true },
          fileUrl: { type: String, required: true },
        },
      ],
      default: [],
      _id: false,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "JobsUser" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobsCompany", jobsCompanyModel);
