"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const jobModel = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    company: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "JobsCompany",
    },
    description: String,
    requirements: [String],
    skills: [String],
    city: String,
    country: String,
    type: { type: String, default: "full-time" },
    salaryRange: Number,
    status: { type: Boolean, default: true },
    applicants: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "JobsUser" }],
}, { timestamps: true });
const Job = mongoose_1.default.model("Job", jobModel);
exports.default = Job;
