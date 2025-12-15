import mongoose from "mongoose";
import { IJobsCompany } from "../interfaces/jobsCompany";

const jobCompanyModel = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    legalName: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    contactPersonName: String,
    phone: String,
    website: String,
    industry: [{ type: mongoose.Schema.Types.ObjectId, ref: "CompanyField" }],
    size: String,
    registrationNumber: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    logo: String,
    about: String,
    foundedAt: String,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    verified: { type: Boolean, default: false },
    jobAdvertisement: [
      { type: mongoose.Schema.Types.ObjectId, ref: "jobAdvertisement" },
    ],
    files: [String],
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const setImageURL = (doc: any) => {
  if (doc.logo) {
    doc.logo = `${process.env.BASE_URL}:${process.env.PORT}/jobCompanies/${doc.logo}`;
  }
  if (doc.files && doc.files.length > 0) {
    doc.files = doc.files.map((file: string) => {
      return `${process.env.BASE_URL}:${process.env.PORT}/jobCompanies/files/${file}`;
    });
  }
};

jobCompanyModel.post("init", function (doc) {
  setImageURL(doc);
});

jobCompanyModel.post("save", function (doc) {
  setImageURL(doc);
});

const JobsCompany = mongoose.model<IJobsCompany>(
  "jobCompanies",
  jobCompanyModel
);

export default JobsCompany;
