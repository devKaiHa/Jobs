import mongoose, { Document, Types } from "mongoose";

export interface IJobsCompany extends Document {
  companyName: string; 
  legalName?: string; 
  email: string;
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
  status?: "pending" | "accepted" | "rejected"; 
  verified?: boolean;
  jobAdvertisement?: Types.ObjectId[]; 
  files?: string[]; 
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
