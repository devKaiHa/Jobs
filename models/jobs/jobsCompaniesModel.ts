import mongoose, { Document } from "mongoose";

export interface IJobsCompany extends Document {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  description?: string;
  logo?: string;
  verified?: boolean;
  jobs?: mongoose.Types.ObjectId[];
  files?: Array<{ key: string; fileUrl: string }>;
  createdBy?: mongoose.Types.ObjectId;
  isActive?: boolean;
}

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

const JobsCompany = mongoose.model<IJobsCompany>(
  "JobsCompany",
  jobsCompanyModel
);
export default JobsCompany;
