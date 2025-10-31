import mongoose, { Schema, Model } from "mongoose";
import { IJobs } from "../interfaces/jobAdvertisement";

const jobAdSchema = new Schema<IJobs>(
  {
    jobTitle: { type: String },
    type: { type: String },
    location: { type: String },
    description: { type: String },
    expectedSalary: { type: Number },
    responsibilities: [{ type: String }],
    qualifications: [{ type: String }],
    endDate: { type: String },
    skills: [{ type: String }],
    companyId: { type: Schema.Types.ObjectId, ref: "jobCompanies" },
    status: { type: Boolean },
  },
  { timestamps: true }
);

const JobModel: Model<IJobs> = mongoose.model<IJobs>(
  "jobAdvertisement",
  jobAdSchema
);

export default JobModel;
