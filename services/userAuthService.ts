import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ApiError from "../utils/apiError";
import createToken from "../utils/createToken";
import User from "../models/userModel";
import sendEmail from "../utils/sendEmail";

// ====== Interfaces ======
interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface SignupRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

interface TwoFactorRequest extends Request {
  body: {
    email: string;
    otpCode: string;
  };
}

interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}

interface ResetCodeRequest extends Request {
  body: {
    email: string;
    resetCode: string;
  };
}

interface ResetPasswordRequest extends Request {
  body: {
    email: string;
    newPassword: string;
  };
}

// ====== Signup ======
export const signupUser = asyncHandler(
  async (req: SignupRequest, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return next(new ApiError("Email already registered", 400));

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      active: true,
    });

    newUser.password = undefined;

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: newUser,
    });
  }
);

// ====== Login ======
export const loginUser = asyncHandler(
  async (req: LoginRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return next(new ApiError("Incorrect email", 401));

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return next(new ApiError("Incorrect password", 401));

    if (!user.active) return next(new ApiError("Account is not active", 401));

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);

    user.passwordResetCode = hashedOtp;
    user.passwordResetExpires = Date.now() + 5 * 60 * 1000; // 5 mins
    await user.save();

    const message = `Hello ${user.name},\nYour login verification code is: ${otpCode}\nThis code will expire in 5 minutes.`;

    await sendEmail({
      email: user.email,
      subject: "SmartPOS Login Verification Code",
      message,
    });

    res.status(200).json({
      status: "pending",
      message: "Verification code sent to your email",
    });
  }
);

// ====== Verify Two-Factor ======
export const verifyTwoFactorUser = asyncHandler(
  async (req: TwoFactorRequest, res: Response, next: NextFunction) => {
    const { email, otpCode } = req.body;

    const user = await User.findOne({
      email,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user)
      return next(new ApiError("Verification code invalid or expired", 400));
    if (!user.passwordResetCode)
      return next(new ApiError("No verification code found", 400));

    const isValid = await bcrypt.compare(otpCode, user.passwordResetCode);
    if (!isValid)
      return next(new ApiError("Verification code invalid or expired", 400));

    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = createToken(user._id);
    user.password = undefined;

    res.status(200).json({
      status: "success",
      message: "Login successful ✅",
      user,
      token,
    });
  }
);

// ====== Protect Middleware for User ======
export const protectUser = asyncHandler(
  async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return next(new ApiError("Not logged in", 401));

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY as string
      ) as { userId: string };

      const currentUser = await User.findById(decoded.userId);
      if (!currentUser) return next(new ApiError("User not found", 404));

      req.user = currentUser;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return next(new ApiError("Token has expired", 401));
      }
      return next(new ApiError("Not logged in", 401));
    }
  }
);

// ====== Forgot Password ======
export const forgotPasswordUser = asyncHandler(
  async (req: ForgotPasswordRequest, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return next(new ApiError("No account found with this email", 404));

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedResetCode = await bcrypt.hash(resetCode, 10);

    user.passwordResetCode = hashedResetCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    user.resetCodeVerified = false;

    await user.save();

    const message = `Hello ${user.name},\nYour password reset code is: ${resetCode}\nThis code will expire in 10 minutes.`;

    await sendEmail({
      email: user.email,
      subject: "SmartPOS Password Reset Code",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Reset code sent to your email",
    });
  }
);

// ====== Verify Reset Code ======
export const verifyPasswordResetCodeUser = asyncHandler(
  async (req: ResetCodeRequest, res: Response, next: NextFunction) => {
    const { email, resetCode } = req.body;

    const now = new Date();

    const user = await User.findOne({
      email,
      passwordResetExpires: { $gt: now },
    });

    if (!user) return next(new ApiError("Reset code invalid or expired", 400));

    if (!user.passwordResetCode)
      return next(new ApiError("No reset code found", 400));

    const isValid = await bcrypt.compare(resetCode, user.passwordResetCode);

    if (!isValid)
      return next(new ApiError("Reset code invalid or expired", 400));

    user.resetCodeVerified = true;
    await user.save();

    res.status(200).json({ status: "success", message: "Code verified" });
  }
);

// ====== Reset Password ======
export const resetPasswordUser = asyncHandler(
  async (req: ResetPasswordRequest, res: Response, next: NextFunction) => {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return next(new ApiError(`No user found with email ${email}`, 404));

    if (!user.resetCodeVerified)
      return next(new ApiError("Reset code not verified", 400));

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.resetCodeVerified = undefined;

    await user.save();

    const token = createToken(user._id);
    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
      user,
      token,
    });
  }
);
