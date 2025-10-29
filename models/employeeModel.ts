import mongoose from "mongoose";
import { IEmployee } from "./interfaces/employee";

const emoloyeeShcema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "employee name is require"],
    },
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
    resetCodeVerified: Boolean,
    passwordResetVerified: Boolean,
    twoFactorCode: String,
    twoFactorExpires: Date,
    twoFactorVerified: {
      type: Boolean,
      default: false,
    },
    archives: {
      type: String,
      enum: ["true", "false"],
      default: "false",
    },

    image: String,
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

const Employee = mongoose.model<IEmployee>("Employee", emoloyeeShcema);
export default Employee;
