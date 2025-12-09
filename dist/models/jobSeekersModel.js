"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const jobSeekersSchema = new mongoose_1.default.Schema({
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
    bio: String,
    education: String,
    specialization: String,
    experience: Number,
    archives: {
        type: String,
        enum: ["true", "false"],
        default: "false",
    },
    city: String,
    birthDate: Date,
    skills: [String],
    licenses: String,
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
    // favorite: [String],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
const setImageURL = (doc) => {
    if (doc.profileImage) {
        const imageUrl = `${process.env.BASE_URL}/jobSeekers/${doc.profileImage}`;
        doc.profileImage = imageUrl;
    }
    if (doc.cv) {
        const cvUrl = `${process.env.BASE_URL}/cv/${doc.cv}`;
        doc.cv = cvUrl;
    }
    if (doc.licenses) {
        const licensesUrl = `${process.env.BASE_URL}/licenses/${doc.licenses}`;
        doc.licenses = licensesUrl;
    }
};
jobSeekersSchema.post("init", function (doc) {
    setImageURL(doc);
});
jobSeekersSchema.post("save", (doc) => {
    setImageURL(doc);
});
const JobSeekers = mongoose_1.default.model("jobSeekers", jobSeekersSchema);
exports.default = JobSeekers;
