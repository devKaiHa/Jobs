import mongoose, { Document, Types } from "mongoose";

export interface IEmployee extends Document {
  name: string;
  email: string;
  active?: boolean;
  password: string;
  passwordChangedAt?: string;
  passwordResetCode?: string;
  passwordResetExpires?: string;
  passwordResetVerified?: boolean;
  resetCodeVerified?: boolean;
  archives?: string;
  image?: string;
}
