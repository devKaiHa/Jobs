import mongoose from "mongoose";

export interface IWishlist extends Document {
  jobSeeker: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  createdAt: Date;
}
