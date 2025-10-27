const mongoose = require("mongoose");

const jobsUserModel = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, //"user", "company", "admin", "superadmin"
    phone: String,
    city: String,
    country: String,
    gender: String,
    birthDate: Date,
    cvFile: String,
    skills: [String],
    licenses: [String],
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobsUser", jobsUserModel);
