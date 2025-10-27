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
    pin: {
      type: Number,
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
    passwordResetExpires: String,
    passwordResetVerified: Boolean,
    selectedRoles: {
      type: mongoose.Schema.ObjectId,
      ref: "Roles",
    },

    archives: {
      type: String,
      enum: ["true", "false"],
      default: "false",
    },
    companySubscribtionId: {
      type: mongoose.Schema.ObjectId,
    },
    salesPoint: { type: mongoose.Schema.ObjectId, ref: "salesPoints" },
    tags: [
      {
        id: String,
        name: String,
        color: String,
        _id: false,
      },
    ],
    expenseTags: [
      {
        id: String,
        name: String,
        color: String,
        _id: false,
      },
    ],
    purchaseTags: [
      {
        id: String,
        name: String,
        color: String,
        _id: false,
      },
    ],
    salesTags: [
      {
        id: String,
        name: String,
        color: String,
        _id: false,
      },
    ],
    stocks: [{ stockId: String, stockName: String, _id: false }],
    sync: { type: Boolean, default: false },
    image: String,
    selectedQuickActions: { type: [String], default: [] },
    company: [
      {
        companyId: String,
        selectedRoles: {
          type: mongoose.Schema.ObjectId,
          ref: "Roles",
        },
        companyName: String,
        _id: false,
      },
    ],
    PosUser: { type: Boolean, default: false },
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
