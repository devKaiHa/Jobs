import { Document, ObjectId } from "mongoose";

export interface ICompanyInfo {
  name?: string;
  logo?: string;
  location?: string;
  email?: string;
}

export interface IJobs extends Document {
  jobTitle?: string;
  type?: string;
  location?: string;
  description?: string;
  expectedSalary?: number;
  responsibilities?: string[];
  qualifications?: string[];
  endDate?: string;
  skills?: string[];
  companyInfo?: ICompanyInfo;
  status?: boolean;
  companyId?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
