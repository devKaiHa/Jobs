import mongoose from "mongoose";
import { IJob } from "../interfaces/jobs";

const jobModel = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobsCompany",
    },
    description: String,
    requirements: [String],
    skills: [String],
    city: String,
    country: String,
    type: { type: String, default: "full-time" },
    salaryRange: Number,
    status: { type: Boolean, default: true },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "JobsUser" }],
  },
  { timestamps: true }
);

const Job = mongoose.model<IJob>("Job", jobModel);
export default Job;
