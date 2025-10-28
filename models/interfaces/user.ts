import { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  lastName?: string;
  email: string;
  active?: boolean;
  password: string;
  passwordChangedAt?: string;
  passwordResetCode?: string;
  passwordResetExpires?: string;
  passwordResetVerified?: boolean;
  resetCodeVerified?: boolean;
  archives?: string;
  profileImage?: string;
  role?: string;
  gender?: string;
  cv?: string;
  phone?: string;
}
