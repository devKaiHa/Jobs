import mongoose from "mongoose";
import { ICompanyField } from "./interfaces/companyField";

const companyFieldSchema = new mongoose.Schema(
  {
    title: String,
    titleAr: String,
    code: String,
  },
  { timestamps: true }
);

const CompanyField = mongoose.model<ICompanyField>(
  "CompanyField",
  companyFieldSchema
);
export default CompanyField;
