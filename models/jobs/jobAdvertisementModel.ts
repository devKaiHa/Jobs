import mongoose, { Schema, Model } from "mongoose";
import { IJobs } from "../interfaces/jobAdvertisement";

const jobAdSchema = new Schema<IJobs>(
  {
    jobTitle: { type: String },
    type: { type: String },
    location: { type: String },
    description: { type: String },
    expectedSalary: { type: Number },
    responsibilities: [{ type: String }],
    qualifications: [{ type: String }],
    endDate: { type: String },
    skills: [{ type: String }],
    companyInfo: {
      name: { type: String },
      logo: { type: String },
      location: { type: String },
      email: { type: String },
    },
    status: { type: Boolean },
  },
  { timestamps: true }
);

const setImageURL = (doc: IJobs) => {
  if (doc.companyInfo && doc.companyInfo.logo) {
    const imageUrl = `${process.env.BASE_URL}/jobAdvertisement/${doc.companyInfo.logo}`;
    doc.companyInfo.logo = imageUrl;
  }
};

jobAdSchema.post("init", function (doc) {
  setImageURL(doc as IJobs);
});

jobAdSchema.post("save", function (doc) {
  setImageURL(doc as IJobs);
});

const JobModel: Model<IJobs> = mongoose.model<IJobs>(
  "jobAdvertisement",
  jobAdSchema
);

export default JobModel;
