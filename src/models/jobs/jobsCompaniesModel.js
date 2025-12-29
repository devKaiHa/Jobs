"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const jobCompanyModel = new mongoose_1.default.Schema({
    companyName: { type: String, required: true },
    legalName: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    contactPersonName: String,
    phone: String,
    website: String,
    industry: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "CompanyField" }],
    size: String,
    registrationNumber: String,
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
    },
    logo: String,
    about: String,
    foundedAt: String,
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    verified: { type: Boolean, default: false },
    jobAdvertisement: [
        { type: mongoose_1.default.Schema.Types.ObjectId, ref: "jobAdvertisement" },
    ],
    files: [String],
    isActive: { type: Boolean, default: false },
}, { timestamps: true });
const setImageURL = (doc) => {
    if (doc.logo) {
        doc.logo = `${process.env.BASE_URL}:${process.env.PORT}/jobCompanies/${doc.logo}`;
    }
    if (doc.files && doc.files.length > 0) {
        doc.files = doc.files.map((file) => {
            return `${process.env.BASE_URL}:${process.env.PORT}/jobCompanies/files/${file}`;
        });
    }
};
jobCompanyModel.post("init", function (doc) {
    setImageURL(doc);
});
jobCompanyModel.post("save", function (doc) {
    setImageURL(doc);
});
const JobsCompany = mongoose_1.default.model("jobCompanies", jobCompanyModel);
exports.default = JobsCompany;
