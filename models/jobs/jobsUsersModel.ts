import mongoose, { Document } from "mongoose";

export interface IJobsUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  city?: string;
  country?: string;
  gender?: string;
  birthDate?: Date;
  cvFile?: string;
  skills?: string[];
  licenses?: string[];
  verified?: boolean;
  isActive?: boolean;
}

const jobsUserModel = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, //"user", "company", "admin", "superadmin"
    phone: String,
    city: String,
    country: String,
    gender: String,
    birthDate: Date,
    cvFile: String,
    skills: [String],
    licenses: [String],
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const JobsUser = mongoose.model<IJobsUser>("JobsUser", jobsUserModel);
export default JobsUser;
