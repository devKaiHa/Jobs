import mongoose from "mongoose";
import { IUser } from "./interfaces/user";

const emoloyeeShcema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "employee name is require"],
    },
    lastName: String,
    email: {
      type: String,
      require: [true, "email is require"],
      lowercase: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [4, "Password must be at least 4 characters long"],
    },
    passwordChangedAt: String,
    passwordResetCode: String,
    passwordResetExpires: Number,
    passwordResetVerified: Boolean,
    resetCodeVerified: Boolean,
    archives: {
      type: String,
      enum: ["true", "false"],
      default: "false",
    },

    profileImage: String,
    role: { type: String, default: "user" },
    cv: String,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
  },
  { timestamps: true }
);

const setImageURL = (doc: any) => {
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/Image/${doc.image}`;
    doc.image = imageUrl;
  }
};

emoloyeeShcema.post("init", function (doc: any) {
  setImageURL(doc);
});

emoloyeeShcema.post("save", (doc: any) => {
  setImageURL(doc);
});

const User = mongoose.model<IUser>("User", emoloyeeShcema);
export default User;
