import mongoose from "mongoose";
import { IJobsCompany } from "../interfaces/jobsCompany";

const jobCompanyModel = new mongoose.Schema(
  {
    name: String,
    slug: String,
    email: String,
    phone: String,
    city: String,
    country: String,
    description: String,
    logo: String,
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
    doc.logo = `${process.env.BASE_URL}/jobCompanies/${doc.logo}`;
  }
  if (doc.files && doc.files.length > 0) {
    doc.files = doc.files.map((file: string) => {
      return `${process.env.BASE_URL}/jobCompanies/files/${file}`;
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
