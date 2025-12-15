import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ApiError from "../utils/apiError";
import createToken from "../utils/createToken";
import Employee from "../models/employeeModel";
import { IEmployee } from "../models/interfaces/employee";
import sendEmail from "../utils/sendEmail";
import isEmail from "../utils/tools/isEmail";
import generatePassword from "../utils/tools/generatePassword";
import { Document, Types } from "mongoose";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

// ====== Interfaces ======
interface LoginRequest extends Request {
  body: { email: string; password: string };
}

interface createEmployeeRequest extends Request {
  body: { name: string; email: string; password?: string };
}

interface AuthenticatedRequest extends Request {
  user?: IEmployee;
}

interface ForgotPasswordRequest extends Request {
  body: { email: string };
}

interface ResetCodeRequest extends Request {
  body: { email: string; resetCode: string };
}

interface ResetPasswordRequest extends Request {
  body: { email: string; newPassword: string };
}
interface reSendPasswordRequest extends Request {
  body: { email: string; password: string };
}

const multerStorage = multer.memoryStorage();

// image filter
const multerFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
export const uploadEmployeeImage = upload.fields([
  { name: "image", maxCount: 1 },
]);

export const processEmployeeImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.files && (req.files as any).image) {
      const imageFile = (req.files as any).image[0];
      const imageFilename = `image-${uuidv4()}-${Date.now()}.png`;

      await sharp(imageFile.buffer)
        .toFormat("png")
        .png({ quality: 70 })
        .toFile(`uploads/employee/${imageFilename}`);

      req.body.image = imageFilename;
    }

    next();
  }
);

export const createEmployee = asyncHandler(
  async (req: createEmployeeRequest, res: Response, next: NextFunction) => {
    const email = req.body.email;
    const name = req.body.name;

    const findEmployee = await Employee.findOne({ email });
    //Check if the email format is true or not
    if (isEmail(email)) {
      //Generate Password
      const employeePass = generatePassword();
      let employee: Document<unknown, {}, IEmployee> &
        IEmployee & { _id: Types.ObjectId };

      //Send password to email
      if (!findEmployee) {
        req.body.password = await bcrypt.hash(employeePass, 12);
        await sendEmail({
          email: req.body.email,
          subject: "New Password",
          message: `Hello ${req.body.name}, Your password is ${employeePass}`,
        });
        employee = await Employee.create(req.body);
      } else {
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
    } else {
      return next(new ApiError("There is an error in email format", 500));
    }
  }
);

export const reSendPassword = asyncHandler(
  async (req: reSendPasswordRequest, res: Response, next: NextFunction) => {
    const email = req.body.email;

    //Check if the email format is true or not

    const findEmployee = await Employee.findOne({ email: req.body.email });
    if (!findEmployee) {
      res.status(400).json({
        status: false,
        message: "Email not found",
      });
    }

    try {
      //Generate Password
      const employeePass = generatePassword();
      const hashedPassword = await bcrypt.hash(employeePass, 12);

      req.body.password = hashedPassword;
      //Sned password to email
      await sendEmail({
        email: req.body.email,
        subject: "New Password",
        message: `Hello ${findEmployee.name}, Your password is ${employeePass}`,
      });
      const employee = await Employee.findOneAndUpdate(
        { email: email },
        { password: hashedPassword },
        { new: true }
      );

      res.status(201).json({
        status: 200,
        message: "Employee Update Password",
        data: employee,
      });
    } catch (error) {
      next(error);
    }
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

    if (user.archives === "true")
      return next(new ApiError("Account is not active", 401));

    const token = createToken(user);
    user.password = undefined;

    res.status(200).json({
      status: "success",
      message: "Login successful ✅",
      user,
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
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY as string
      ) as { email: string };
      console.log("decoded", decoded);

      const currentUser = await Employee.findOne({ email: decoded.email });
      if (!currentUser)
        return next(new ApiError("Employee does not exist", 404));

      req.user = currentUser;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError")
        return next(new ApiError("Token has expired", 401));

      return next(new ApiError("Not logged in", 401));
    }
  }
);

// ====== Forgot Password ======
export const forgotPassword = asyncHandler(
  async (req: ForgotPasswordRequest, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const user = await Employee.findOne({ email });
    if (!user)
      return next(new ApiError("No account found with this email", 404));

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = await bcrypt.hash(resetCode, 10);

    user.passwordResetCode = hashedResetCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    user.resetCodeVerified = false;

    await user.save();

    res.status(200).json({
      status: "success",
      message: `Reset code generated successfully (for testing): ${resetCode}`,
    });
  }
);

// ====== Verify Reset Code ======
export const verifyPasswordResetCodePos = asyncHandler(
  async (req: ResetCodeRequest, res: Response, next: NextFunction) => {
    const { email, resetCode } = req.body;

    const user = await Employee.findOne({
      email,
      passwordResetExpires: { $gt: new Date() },
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
export const resetPasswordPos = asyncHandler(
  async (req: ResetPasswordRequest, res: Response, next: NextFunction) => {
    const { email, newPassword } = req.body;

    const user = await Employee.findOne({ email });
    if (!user)
      return next(new ApiError(`No employee found with email ${email}`, 404));

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
