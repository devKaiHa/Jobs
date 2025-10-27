"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const jobsUserModel = new mongoose_1.default.Schema({
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, //"user", "company", "admin", "superadmin"
    phone: String,
    city: String,
    country: String,
    gender: String,
    birthDate: Date,
    cvFile: String,
    skills: [String],
    licenses: [String],
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
const JobsUser = mongoose_1.default.model("JobsUser", jobsUserModel);
exports.default = JobsUser;
