import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import ApiError from "../utils/apiError";
import createToken from "../utils/createToken";
import Employee from "../models/employeeModel";
import { IEmployee } from "../models/interfaces/employee";
import sendEmail from "../utils/sendEmail";

type AsyncRequestHandler<T = any> = (
  req: Request & T,
  res: Response,
  next: NextFunction
) => Promise<any>;

// ====== Interfaces ======
interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
    companyId?: string;
  };
}

interface AuthenticatedRequest extends Request {
  user?: IEmployee;
}

interface SignupRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
    companyId?: string;
  };
}

interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}

interface ResetCodeRequest extends Request {
  body: {
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
export const signup = asyncHandler(
  async (req: SignupRequest, res: Response, next: NextFunction) => {
    const { name, email, password, companyId } = req.body;

    const existingUser = await Employee.findOne({ email });
    if (existingUser) return next(new ApiError("Email already registered", 400));

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await Employee.create({
      name,
      email,
      password: hashedPassword,
      active: true,
      company: companyId
        ? [
            {
              companyId,
              companyName: "Default Company",
            },
          ]
        : [],
    });

    const token = createToken(newEmployee._id);

    newEmployee.password = undefined;

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: newEmployee,
      token,
    });
  }
);

// ====== Login ======
export const login = asyncHandler(
  async (req: LoginRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await Employee.findOne({ email });
    if (!user) return next(new ApiError("Incorrect email", 401));

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return next(new ApiError("Incorrect password", 401));

    if (user.archives === "true") return next(new ApiError("Account is not active", 401));

    user.password = undefined;

    const token = createToken(user._id);

    res.status(200).json({
      status: "success",
      data: user,
      token,
    });
  }
);

// ====== Protect Middleware ======
export const protect = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return next(new ApiError("Not logged in", 401));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { userId: string };

      const currentUser = await Employee.findOne({ _id: decoded.userId });
      if (!currentUser) return next(new ApiError("The user does not exist", 404));

      req.user = currentUser;
      next();
    } catch (error: any) {
      console.error("JWT Error:", error.message);
      if (error.name === "TokenExpiredError") {
        return next(new ApiError("Token has expired", 401));
      } else {
        return next(new ApiError("Not logged in", 401));
      }
    }
  }
);

// ====== Forgot Password ======
export const forgotPassword = asyncHandler(
  async (req: ForgotPasswordRequest, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await Employee.findOne({ email });
    if (!user) return next(new ApiError("There is no user with that email", 404));

    const resetCode: string = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode: string = await bcrypt.hash(resetCode, 10);

    user.passwordResetCode = hashedResetCode;
    user.passwordResetExpires = (Date.now() + 10 * 60 * 1000); 
    user.resetCodeVerified = false;

    await user.save();

    const message = `Hello ${user.name},\n\nYour password reset code is: ${resetCode}\nIt will expire in 10 minutes.`;

    await sendEmail({
      email: user.email,
      subject: "SmartPOS Password Reset Code",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Reset code sent to email",
    });
  }
);

// ====== Verify Reset Code ======
export const verifyPasswordResetCodePos = asyncHandler(
  async (req: ResetCodeRequest, res: Response, next: NextFunction) => {
    const { resetCode } = req.body;

    const user = await Employee.findOne({ passwordResetExpires: { $gt: new Date() } });
    if (!user) return next(new ApiError("Reset code is invalid or has expired", 400));
    if (!user.passwordResetCode) return next(new ApiError("No reset code found", 400));

    const isResetCodeValid = await bcrypt.compare(resetCode, user.passwordResetCode);
    if (!isResetCodeValid) return next(new ApiError("Reset code is invalid or has expired", 400));

    user.resetCodeVerified = true;
    await user.save();

    res.status(200).json({ status: "success" });
  }
);

// ====== Reset Password ======
export const resetPasswordPos = asyncHandler(
  async (req: ResetPasswordRequest, res: Response, next: NextFunction) => {
    const { email, newPassword } = req.body;

    const user = await Employee.findOne({ email });
    if (!user) return next(new ApiError(`There is no user with this email address ${email}`, 404));

    if (!user.resetCodeVerified) return next(new ApiError("Reset code not verified", 400));

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.resetCodeVerified = undefined;

    await user.save();

    const token = createToken(user._id);
    res.status(200).json({ user, token });
  }
);
