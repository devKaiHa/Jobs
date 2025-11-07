import { Document, ObjectId } from "mongoose";

export interface IJobSeeker extends Document {
  name: string;
  lastName?: string;
  email: string;
  password: string;
  passwordChangedAt?: string;
  passwordResetCode?: string;
  passwordResetExpires?: number;
  emailVerificationCode?: string;
  emailVerificationExpires?: number;
  resetCodeVerified?: boolean;
  archives?: "true" | "false";
  city?: string;
  bio?: string;
  education?: string;
  pecialization?: string;
  experience?: number;
  birthDate?: Date;
  skills?: string[];
  licenses?: string[];
  country?: string;
  phone?: string;
  verified?: boolean;
  profileImage?: string;
  role?: string;
  cv?: string;
  gender?: "Male" | "Female" | "Other";
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
