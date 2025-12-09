import { Document, ObjectId } from "mongoose";

export interface IJobs extends Document {
  jobTitle?: string;
  type?: string;
  location?: string;
  description?: string;
  expectedSalary?: string;
  responsibilities?: string[];
  qualifications?: string[];
  endDate?: string;
  skills?: string[];
  company?: ObjectId;
  status?: boolean;
  companyId?: String;
  applicantsNumber?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
