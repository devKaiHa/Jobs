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
  isActive?: boolean;
  status? : string ; 
}
