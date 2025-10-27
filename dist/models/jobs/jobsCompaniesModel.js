"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const jobsCompanyModel = new mongoose_1.default.Schema({
    name: String,
    slug: String,
    email: String,
    phone: String,
    city: String,
    country: String,
    description: String,
    logo: String,
    verified: { type: Boolean, default: false },
    jobs: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Job" }],
    files: {
        type: [
            {
                key: { type: String, required: true },
                fileUrl: { type: String, required: true },
            },
        ],
        default: [],
        _id: false,
    },
    createdBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "JobsUser" },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
const JobsCompany = mongoose_1.default.model("JobsCompany", jobsCompanyModel);
exports.default = JobsCompany;
