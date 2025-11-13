import mongoose, { Document } from "mongoose";

export interface IJobsCompany extends Document {
  companyName: string; // required
  legalName?: string;
  email: string; // required and unique
  contactPersonName?: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  registrationNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  logo?: string;
  status?: "pending" | "accepted" | "rejected"; // enum
  verified?: boolean;
  jobAdvertisement?: mongoose.Types.ObjectId[];
  files?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
