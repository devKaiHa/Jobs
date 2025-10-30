import mongoose from "mongoose";
import { IUser } from "./interfaces/jobSekeers";

const jobSeekersSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [4, "Password must be at least 4 characters long"],
    },
    passwordChangedAt: String,
    passwordResetCode: String,
    passwordResetExpires: Number,
    emailVerificationCode: String,
    emailVerificationExpires: Number,
    resetCodeVerified: Boolean,

    archives: {
      type: String,
      enum: ["true", "false"],
      default: "false",
    },
    city: String,
    birthDate: Date,
    skills: [String],
    licenses: [String],
    country: String,
    phone: String,
    verified: { type: Boolean, default: false },
    profileImage: String,
    role: { type: String, default: "user" },
    cv: String,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const setImageURL = (doc: any) => {
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/Image/${doc.image}`;
    doc.image = imageUrl;
  }
};

jobSeekersSchema.post("init", function (doc: any) {
  setImageURL(doc);
});

jobSeekersSchema.post("save", (doc: any) => {
  setImageURL(doc);
});

const JobSeekers = mongoose.model<IUser>("jobSeekers", jobSeekersSchema);
export default JobSeekers;
