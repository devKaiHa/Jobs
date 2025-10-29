import mongoose, { Document, Types } from "mongoose";

export interface IEmployee extends Document {
  name: string;
  email: string;
  active?: boolean;
  password: string;
  passwordChangedAt?: string;
  passwordResetCode?: string;
  passwordResetExpires?: Number;
  passwordResetVerified?: boolean;
  resetCodeVerified?: boolean;
  archives?: string;
  twoFactorCode?: string;
  twoFactorExpires?: Date;
  twoFactorVerified?: boolean;
  image?: string;
}
