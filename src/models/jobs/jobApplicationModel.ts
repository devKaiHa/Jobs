import mongoose, { Schema } from "mongoose";
import { IJobApplication } from "../interfaces/jobApplication";

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: "jobSeekers",
      required: true,
    },
    jobId: { type: Schema.Types.ObjectId, ref: "jobAdvertisement" },
    jobsCompanyId: { type: Schema.Types.ObjectId, ref: "jobCompanies" },
    status: {
      type: String,
      default: "pending",
    },
    coverLetter: String,
    interviewDate: Date,
    feedback: String,
  },
  { timestamps: true }
);

const JobApplication = mongoose.model<IJobApplication>(
  "JobApplication",
  jobApplicationSchema
);

export default JobApplication;
