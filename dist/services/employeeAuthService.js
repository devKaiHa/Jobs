"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordPos = exports.verifyPasswordResetCodePos = exports.forgotPassword = exports.protect = exports.login = exports.reSendPassword = exports.createEmployee = exports.processEmployeeImage = exports.uploadEmployeeImage = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const createToken_1 = __importDefault(require("../utils/createToken"));
const employeeModel_1 = __importDefault(require("../models/employeeModel"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const isEmail_1 = __importDefault(require("../utils/tools/isEmail"));
const generatePassword_1 = __importDefault(require("../utils/tools/generatePassword"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const multerStorage = multer_1.default.memoryStorage();
// image filter
const multerFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/webp") {
        cb(null, true);
    }
    else {
        cb(new Error("Only images are allowed"), false);
    }
};
const upload = (0, multer_1.default)({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadEmployeeImage = upload.fields([
    { name: "image", maxCount: 1 },
]);
exports.processEmployeeImage = (0, express_async_handler_1.default)(async (req, res, next) => {
    if (req.files && req.files.image) {
        const imageFile = req.files.image[0];
        const imageFilename = `image-${(0, uuid_1.v4)()}-${Date.now()}.png`;
        await (0, sharp_1.default)(imageFile.buffer)
            .toFormat("png")
            .png({ quality: 70 })
            .toFile(`uploads/employee/${imageFilename}`);
        req.body.image = imageFilename;
    }
    next();
});
exports.createEmployee = (0, express_async_handler_1.default)(async (req, res, next) => {
    const email = req.body.email;
    const name = req.body.name;
    const findEmployee = await employeeModel_1.default.findOne({ email });
    //Check if the email format is true or not
    if ((0, isEmail_1.default)(email)) {
        //Generate Password
        const employeePass = (0, generatePassword_1.default)();
        let employee;
        //Send password to email
        if (!findEmployee) {
            req.body.password = await bcrypt_1.default.hash(employeePass, 12);
            await (0, sendEmail_1.default)({
                email: req.body.email,
                subject: "New Password",
                message: `Hello ${req.body.name}, Your password is ${employeePass}`,
            });
            employee = await employeeModel_1.default.create(req.body);
        }
        else {
            res.status(400).json({
                status: false,
                message: "Employee already exists",
            });
        }
        res.status(201).json({
            status: "true",
            message: "Employee Inserted",
            data: employee,
        });
    }
    else {
        return next(new apiError_1.default("There is an error in email format", 500));
    }
});
exports.reSendPassword = (0, express_async_handler_1.default)(async (req, res, next) => {
    const email = req.body.email;
    //Check if the email format is true or not
    const findEmployee = await employeeModel_1.default.findOne({ email: req.body.email });
    if (!findEmployee) {
        res.status(400).json({
            status: false,
            message: "Email not found",
        });
    }
    try {
        //Generate Password
        const employeePass = (0, generatePassword_1.default)();
        const hashedPassword = await bcrypt_1.default.hash(employeePass, 12);
        req.body.password = hashedPassword;
        //Sned password to email
        await (0, sendEmail_1.default)({
            email: req.body.email,
            subject: "New Password",
            message: `Hello ${findEmployee.name}, Your password is ${employeePass}`,
        });
        const employee = await employeeModel_1.default.findOneAndUpdate({ email: email }, { password: hashedPassword }, { new: true });
        res.status(201).json({
            status: 200,
            message: "Employee Update Password",
            data: employee,
        });
    }
    catch (error) {
        next(error);
    }
});
// ====== Login ======
exports.login = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await employeeModel_1.default.findOne({ email });
    if (!user)
        return next(new apiError_1.default("Incorrect email", 401));
    const passwordMatch = await bcrypt_1.default.compare(password, user.password);
    if (!passwordMatch)
        return next(new apiError_1.default("Incorrect password", 401));
    if (user.archives === "true")
        return next(new apiError_1.default("Account is not active", 401));
    const token = (0, createToken_1.default)(user._id);
    user.password = undefined;
    res.status(200).json({
        status: "success",
        message: "Login successful ✅",
        user,
        token,
    });
});
// ====== Protect Middleware ======
exports.protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token)
        return next(new apiError_1.default("Not logged in", 401));
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        console.log("decoded", decoded);
        const currentUser = await employeeModel_1.default.findOne({ email: decoded.email });
        if (!currentUser)
            return next(new apiError_1.default("Employee does not exist", 404));
        req.user = currentUser;
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError")
            return next(new apiError_1.default("Token has expired", 401));
        return next(new apiError_1.default("Not logged in", 401));
    }
});
// ====== Forgot Password ======
exports.forgotPassword = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email } = req.body;
    const user = await employeeModel_1.default.findOne({ email });
    if (!user)
        return next(new apiError_1.default("No account found with this email", 404));
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = await bcrypt_1.default.hash(resetCode, 10);
    user.passwordResetCode = hashedResetCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    user.resetCodeVerified = false;
    await user.save();
    res.status(200).json({
        status: "success",
        message: `Reset code generated successfully (for testing): ${resetCode}`,
    });
});
// ====== Verify Reset Code ======
exports.verifyPasswordResetCodePos = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email, resetCode } = req.body;
    const user = await employeeModel_1.default.findOne({
        email,
        passwordResetExpires: { $gt: new Date() },
    });
    if (!user)
        return next(new apiError_1.default("Reset code invalid or expired", 400));
    if (!user.passwordResetCode)
        return next(new apiError_1.default("No reset code found", 400));
    const isValid = await bcrypt_1.default.compare(resetCode, user.passwordResetCode);
    if (!isValid)
        return next(new apiError_1.default("Reset code invalid or expired", 400));
    user.resetCodeVerified = true;
    await user.save();
    res.status(200).json({ status: "success", message: "Code verified" });
});
// ====== Reset Password ======
exports.resetPasswordPos = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email, newPassword } = req.body;
    const user = await employeeModel_1.default.findOne({ email });
    if (!user)
        return next(new apiError_1.default(`No employee found with email ${email}`, 404));
    if (!user.resetCodeVerified)
        return next(new apiError_1.default("Reset code not verified", 400));
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.resetCodeVerified = undefined;
    await user.save();
    const token = (0, createToken_1.default)(user._id);
    res.status(200).json({
        status: "success",
        message: "Password reset successfully",
        user,
        token,
    });
});
