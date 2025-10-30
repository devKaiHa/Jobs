import mongoose, { Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  company?: mongoose.Types.ObjectId;
  description?: string;
  requirements?: string[];
  skills?: string[];
  city?: string;
  country?: string;
  type?: string;
  salaryRange?: number;
  status?: boolean;
  applicants?: mongoose.Types.ObjectId[];
}