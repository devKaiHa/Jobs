import mongoose, { Document, Types } from "mongoose";

export interface IEmployee extends Document {
  name: string;
  email: string;
  pin?: number;
  active?: boolean;
  password: string;
  passwordChangedAt?: string;
  passwordResetCode?: string;
  passwordResetExpires?: string;
  passwordResetVerified?: boolean;
  resetCodeVerified?: boolean;
  selectedRoles?: Types.ObjectId;
  archives?: string;
  companySubscribtionId?: Types.ObjectId;
  salesPoint?: Types.ObjectId;
  tags?: Array<{ id?: string; name?: string; color?: string }>;
  expenseTags?: Array<{ id?: string; name?: string; color?: string }>;
  purchaseTags?: Array<{ id?: string; name?: string; color?: string }>;
  salesTags?: Array<{ id?: string; name?: string; color?: string }>;
  stocks?: Array<{ stockId?: string; stockName?: string }>;
  sync?: boolean;
  image?: string;
  selectedQuickActions?: string[];
  company?: Array<{
    companyId?: string;
    selectedRoles?: Types.ObjectId;
    companyName?: string;
  }>;
  PosUser?: boolean;
}
