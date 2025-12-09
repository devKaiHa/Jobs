"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordJobSeekers = exports.verifyPasswordResetCodeJobSeekers = exports.forgotPasswordJobSeekers = exports.loginJobSeekers = exports.verifyEmailJobSeekers = exports.signupJobSeekers = exports.protect = exports.googleLogin = exports.processJobSeekerFiles = exports.uploadJobSeekerFiles = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const createToken_1 = __importDefault(require("../utils/createToken"));
const jobSeekersModel_1 = __importDefault(require("../models/jobSeekersModel"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const google_auth_library_1 = require("google-auth-library");
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const multerStorage = multer_1.default.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image") ||
        file.mimetype === "application/pdf" ||
        file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/msword") {
        cb(null, true);
    }
    else {
        cb(new apiError_1.default("Only images or CV files are allowed", 400), false);
    }
};
const upload = (0, multer_1.default)({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadJobSeekerFiles = upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "cv", maxCount: 1 },
    { name: "licenses", maxCount: 1 },
]);
exports.processJobSeekerFiles = (0, express_async_handler_1.default)(async (req, res, next) => {
    if (req.files && req.files.profileImage) {
        const imageFile = req.files.profileImage[0];
        const imageFilename = `profileImage-${(0, uuid_1.v4)()}-${Date.now()}.png`;
        await (0, sharp_1.default)(imageFile.buffer)
            .toFormat("png")
            .png({ quality: 70 })
            .toFile(`uploads/jobSeekers/${imageFilename}`);
        req.body.profileImage = imageFilename;
    }
    //  Process CV file
    if (req.files && req.files.cv) {
        const cvFile = req.files.cv[0];
        const cvExt = cvFile.mimetype.split("/")[1] || "pdf"; // get file extension
        const cvFilename = `cv-${(0, uuid_1.v4)()}-${Date.now()}.${cvExt}`;
        const fs = require("fs");
        fs.writeFileSync(`uploads/cv/${cvFilename}`, cvFile.buffer);
        req.body.cv = cvFilename;
    }
    if (req.files && req.files.licenses) {
        const licenseFile = req.files.licenses[0];
        const licenseExt = licenseFile.mimetype.split("/")[1] || "pdf";
        const licenseFilename = `license-${(0, uuid_1.v4)()}-${Date.now()}.${licenseExt}`;
        const fs = require("fs");
        fs.writeFileSync(`uploads/licenses/${licenseFilename}`, licenseFile.buffer);
        req.body.licenses = licenseFilename;
    }
    next();
});
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload)
        return next(new apiError_1.default("Google token not valid", 400));
    const { email, name, picture } = payload;
    let jobSeeker = await jobSeekersModel_1.default.findOne({ email });
    if (!jobSeeker) {
        jobSeeker = await jobSeekersModel_1.default.create({
            name,
            email,
            verified: true,
            profileImage: picture,
            password: Math.random().toString(36).slice(-8),
        });
    }
    const jwtToken = (0, createToken_1.default)(jobSeeker._id);
    res.status(200).json({
        status: "success",
        message: "Logged in with Google successfully",
        jobSeeker,
        token: jwtToken,
    });
});
exports.protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token)
        return next(new apiError_1.default("Not logged in", 401));
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        const currentUser = await jobSeekersModel_1.default.findById(decoded.userId);
        if (!currentUser)
            return next(new apiError_1.default("JobSeeker does not exist", 404));
        req.user = currentUser;
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError")
            return next(new apiError_1.default("Token has expired", 401));
        return next(new apiError_1.default("Not logged in", 401));
    }
});
// ====== Signup (with Email Verification) ======
exports.signupJobSeekers = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { name, email, password } = req.body;
    const existingJobSeeker = await jobSeekersModel_1.default.findOne({ email });
    if (existingJobSeeker)
        return next(new apiError_1.default("Email already registered", 400));
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    // Generate email verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedVerificationCode = await bcrypt_1.default.hash(verificationCode, 10);
    const newJobSeeker = await jobSeekersModel_1.default.create({
        ...req.body,
        name,
        password: hashedPassword,
        active: false,
        emailVerificationCode: hashedVerificationCode,
        emailVerificationExpires: Date.now() + 10 * 60 * 1000,
    });
    // Send verification email
    const message = `Hello ${name},\n\nYour email verification code is: ${verificationCode}\nThis code will expire in 10 minutes.\n\nThank you,\nSmartPOS Team`;
    await (0, sendEmail_1.default)({
        email,
        subject: "Verify your email - LinkedOut",
        message,
    });
    res.status(201).json({
        status: "pending",
        message: "Verification code sent to your email. Please verify to activate your account.",
        user: newJobSeeker,
        role: "job_seeker",
    });
});
// ====== Verify Email ======
exports.verifyEmailJobSeekers = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email, verificationCode } = req.body;
    const jobSeeker = await jobSeekersModel_1.default.findOne({
        email,
        emailVerificationExpires: { $gt: new Date() },
    });
    if (!jobSeeker)
        return next(new apiError_1.default("Verification code invalid or expired", 400));
    const isValid = await bcrypt_1.default.compare(verificationCode, jobSeeker.emailVerificationCode);
    if (!isValid)
        return next(new apiError_1.default("Verification code invalid or expired", 400));
    jobSeeker.verified = true;
    jobSeeker.emailVerificationCode = undefined;
    jobSeeker.emailVerificationExpires = undefined;
    await jobSeeker.save();
    res.status(200).json({
        status: "success",
        message: "Email verified successfully",
    });
});
// ====== Login (only for verified users) ======
exports.loginJobSeekers = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email, password } = req.body;
    const jobSeeker = await jobSeekersModel_1.default.findOne({ email });
    if (!jobSeeker)
        return next(new apiError_1.default("Incorrect email", 401));
    if (!jobSeeker.verified)
        return next(new apiError_1.default("Please verify your email before logging in", 401));
    const passwordMatch = await bcrypt_1.default.compare(password, jobSeeker.password);
    if (!passwordMatch)
        return next(new apiError_1.default("Incorrect password", 401));
    const token = (0, createToken_1.default)(jobSeeker._id);
    jobSeeker.password = undefined;
    res.status(200).json({
        status: "success",
        message: "Login successful",
        jobSeeker,
        token,
    });
});
// ====== Forgot Password ======
exports.forgotPasswordJobSeekers = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email } = req.body;
    const jobSeeker = await jobSeekersModel_1.default.findOne({ email });
    if (!jobSeeker)
        return next(new apiError_1.default("No account found with this email", 404));
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = await bcrypt_1.default.hash(resetCode, 10);
    jobSeeker.passwordResetCode = hashedResetCode;
    jobSeeker.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    jobSeeker.resetCodeVerified = false;
    await jobSeeker.save();
    const message = `Hello ${jobSeeker.name},\n\nYour password reset code is: ${resetCode}\nThis code will expire in 10 minutes.\n\nLinkedOut Team`;
    await (0, sendEmail_1.default)({
        email: jobSeeker.email,
        subject: "SmartPOS Password Reset Code",
        message,
    });
    res.status(200).json({
        status: "success",
        message: "Reset code sent to your email",
    });
});
// ====== Verify Password Reset Code ======
exports.verifyPasswordResetCodeJobSeekers = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email, resetCode } = req.body;
    const jobSeeker = await jobSeekersModel_1.default.findOne({
        email,
        passwordResetExpires: { $gt: new Date() },
    });
    if (!jobSeeker)
        return next(new apiError_1.default("Reset code invalid or expired", 400));
    const isValid = await bcrypt_1.default.compare(resetCode, jobSeeker.passwordResetCode);
    if (!isValid)
        return next(new apiError_1.default("Reset code invalid or expired", 400));
    jobSeeker.resetCodeVerified = true;
    await jobSeeker.save();
    res.status(200).json({
        status: "success",
        message: "Code verified successfully",
    });
});
// ====== Reset Password ======
exports.resetPasswordJobSeekers = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email, newPassword } = req.body;
    const jobSeeker = await jobSeekersModel_1.default.findOne({ email });
    if (!jobSeeker)
        return next(new apiError_1.default(`No job seeker found with email ${email}`, 404));
    if (!jobSeeker.resetCodeVerified)
        return next(new apiError_1.default("Reset code not verified", 400));
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    jobSeeker.password = hashedPassword;
    jobSeeker.passwordResetCode = undefined;
    jobSeeker.passwordResetExpires = undefined;
    jobSeeker.resetCodeVerified = undefined;
    await jobSeeker.save();
    res.status(200).json({
        status: "success",
        message: "Password reset successfully",
        jobSeeker,
    });
});
