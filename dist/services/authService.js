"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordPos = exports.verifyPasswordResetCodePos = exports.protect = exports.login = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const createToken_1 = __importDefault(require("../utils/createToken"));
const employeeModel_1 = __importDefault(require("../models/employeeModel"));
// @desc      Login
// @route     POST /api/auth/login
// @access    Public
exports.login = (0, express_async_handler_1.default)(async (req, res, next) => {
    try {
        // Fetch the user and check email and password in parallel
        const user = await employeeModel_1.default.findOne({
            email: req.body.email,
        });
        if (!user) {
            return next(new apiError_1.default("Incorrect email", 401));
        }
        // Check password
        const passwordMatch = await bcrypt_1.default.compare(req.body.password, user.password);
        if (!passwordMatch) {
            return next(new apiError_1.default("Incorrect Password", 401));
        }
        // Check if the user is active
        if (user.archives === "true") {
            return next(new apiError_1.default("The account is not active", 401));
        }
        // Remove the password and pin from the user object
        user.password = undefined;
        const token = (0, createToken_1.default)(user._id);
        res.status(200).json({
            status: "true",
            data: user,
            token,
        });
    }
    catch (error) {
        console.error("Error during login:", error);
        next(error);
    }
});
// @desc   make sure the user is logged in sys
exports.protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return next(new apiError_1.default("Not login", 401));
    }
    try {
        // Verify token (no change happens, expired token)
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        // Check if user exists
        const currentUser = await employeeModel_1.default.findOne({
            _id: decoded.userId,
        });
        if (!currentUser) {
            return next(new apiError_1.default("The user does not exist", 404));
        }
        req.user = currentUser;
        next();
    }
    catch (error) {
        // Token verification failed
        console.error("JWT Error:", error.message);
        if (error.name === "TokenExpiredError") {
            return next(new apiError_1.default("Token has expired", 401));
        }
        else {
            console.error("JWT Error:", error.message);
            return next(new apiError_1.default("Not login", 401));
        }
    }
});
// @desc      Verify reset password code
// @route     POST /api/auth/verifyresetcodepos
// @access    Public
exports.verifyPasswordResetCodePos = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { resetCode } = req.body;
    const user = await employeeModel_1.default.findOne({
        passwordResetExpires: { $gt: new Date() },
    });
    if (!user) {
        return next(new apiError_1.default("Reset code is invalid or has expired", 400));
    }
    if (!user.passwordResetCode) {
        return next(new apiError_1.default("No reset code found", 400));
    }
    // 3) Compare the reset code with the hashed code stored in the database
    const isResetCodeValid = await bcrypt_1.default.compare(resetCode, user.passwordResetCode);
    if (!isResetCodeValid) {
        return next(new apiError_1.default("Reset code is invalid or has expired", 400));
    }
    // 4) Mark reset code as verified
    user.resetCodeVerified = true;
    await user.save();
    res.status(200).json({
        status: "Success",
    });
});
// @desc      Reset password
// @route     POST /api/auth/resetpasswordpos
// @access    Public
exports.resetPasswordPos = (0, express_async_handler_1.default)(async (req, res, next) => {
    // 1) Get user based on email
    const user = await employeeModel_1.default.findOne({
        email: req.body.email,
    });
    if (!user) {
        return next(new apiError_1.default(`There is no user with this email address ${req.body.email}`, 404));
    }
    // Check if user verify the reset code
    if (!user.resetCodeVerified) {
        return next(new apiError_1.default("reset code not verified", 400));
    }
    const hashedPassword = await bcrypt_1.default.hash(req.body.newPassword, 10);
    // 2) Update user password & Hide passwordResetCode & passwordResetExpires from the result
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.resetCodeVerified = undefined;
    await user.save();
    // 3) If everything ok, send token to client
    const token = (0, createToken_1.default)(user._id);
    res.status(200).json({ user: user, token });
});
