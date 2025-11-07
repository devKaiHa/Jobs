import mongoose, { Schema } from "mongoose";
import { IWishlist } from "../interfaces/wishlist";

const wishlistSchema = new Schema<IWishlist>(
  {
    jobSeeker: {
      type: Schema.Types.ObjectId,
      ref: "jobSeekers",
      required: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "jobAdvertisement",
      required: true,
    },
  },
  { timestamps: true }
);

wishlistSchema.index({ jobSeeker: 1, job: 1 }, { unique: true });

const Wishlist = mongoose.model<IWishlist>("Wishlist", wishlistSchema);
export default Wishlist;
