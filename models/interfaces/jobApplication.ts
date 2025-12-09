import mongoose, { Schema, Document } from "mongoose";

export interface IJobApplication extends Document {
  jobSeekerId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  jobsCompanyId: mongoose.Types.ObjectId;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  appliedAt: Date;
  coverLetter?: string;
  notes?: string;
  interviewDate?: Date;
  feedback?: string;
}
