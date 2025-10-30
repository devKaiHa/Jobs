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
    status: {
      type: String,
      default: "pending",
    },
    appliedAt: { type: Date, default: Date.now },
    resume: String,
    coverLetter: String,
    notes: String,
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
