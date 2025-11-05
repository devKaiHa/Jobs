import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ApiError from "../utils/apiError";
import createToken from "../utils/createToken";
import JobSeekers from "../models/jobSeekersModel";
import sendEmail from "../utils/sendEmail";
import { OAuth2Client } from "google-auth-library";
import { IJobSeeker } from "../models/interfaces/jobSekeers";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

// ====== Interfaces ======
interface SignupRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface VerifyEmailRequest extends Request {
  body: {
    email: string;
    verificationCode: string;
  };
}

interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}
interface googleLoginRequest extends Request {
  body: {
    token: string;
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
interface AuthenticatedRequest extends Request {
  user?: IJobSeeker;
}

const multerStorage = multer.memoryStorage();

const multerFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype === "application/pdf" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword"
  ) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images or CV files are allowed", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadJobSeekerFiles = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "cv", maxCount: 1 },
  { name: "licenses", maxCount: 1 },
]);

export const processJobSeekerFiles = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.files && (req.files as any).profileImage) {
      const imageFile = (req.files as any).profileImage[0];
      const imageFilename = `profileImage-${uuidv4()}-${Date.now()}.png`;

      await sharp(imageFile.buffer)
        .toFormat("png")
        .png({ quality: 70 })
        .toFile(`uploads/jobSeekers/${imageFilename}`);

      req.body.profileImage = imageFilename;
    }

    //  Process CV file
    if (req.files && (req.files as any).cv) {
      const cvFile = (req.files as any).cv[0];
      const cvExt = cvFile.mimetype.split("/")[1] || "pdf"; // get file extension
      const cvFilename = `cv-${uuidv4()}-${Date.now()}.${cvExt}`;

      const fs = require("fs");
      fs.writeFileSync(`uploads/cv/${cvFilename}`, cvFile.buffer);

      req.body.cv = cvFilename;
    }
    if (req.files && (req.files as any).licenses) {
      const licenseFile = (req.files as any).licenses[0];
      const licenseExt = licenseFile.mimetype.split("/")[1] || "pdf";
      const licenseFilename = `license-${uuidv4()}-${Date.now()}.${licenseExt}`;

      const fs = require("fs");
      fs.writeFileSync(
        `uploads/licenses/${licenseFilename}`,
        licenseFile.buffer
      );

      req.body.licenses = licenseFilename;
    }

    next();
  }
);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = asyncHandler(
  async (req: googleLoginRequest, res: Response, next: NextFunction) => {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return next(new ApiError("Google token not valid", 400));

    const { email, name, picture } = payload;

    let jobSeeker = await JobSeekers.findOne({ email });

    if (!jobSeeker) {
      jobSeeker = await JobSeekers.create({
        name,
        email,
        verified: true,
        profileImage: picture,
        password: Math.random().toString(36).slice(-8),
      });
    }

    const jwtToken = createToken(jobSeeker._id);

    res.status(200).json({
      status: "success",
      message: "Logged in with Google successfully",
      jobSeeker,
      token: jwtToken,
    });
  }
);

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
      ) as { userId: string };

      const currentUser = await JobSeekers.findById(decoded.userId);
      if (!currentUser)
        return next(new ApiError("JobSeeker does not exist", 404));

      req.user = currentUser;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError")
        return next(new ApiError("Token has expired", 401));

      return next(new ApiError("Not logged in", 401));
    }
  }
);

// ====== Signup (with Email Verification) ======
export const signupJobSeekers = asyncHandler(
  async (req: SignupRequest, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    const existingJobSeeker = await JobSeekers.findOne({ email });
    if (existingJobSeeker)
      return next(new ApiError("Email already registered", 400));

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const hashedVerificationCode = await bcrypt.hash(verificationCode, 10);

    const newJobSeeker = await JobSeekers.create({
      ...req.body,
      name,
      password: hashedPassword,
      active: false,
      emailVerificationCode: hashedVerificationCode,
      emailVerificationExpires: Date.now() + 10 * 60 * 1000,
    });

    // Send verification email
    const message = `Hello ${name},\n\nYour email verification code is: ${verificationCode}\nThis code will expire in 10 minutes.\n\nThank you,\nSmartPOS Team`;

    await sendEmail({
      email,
      subject: "Verify your email - LinkedOut",
      message,
    });

    res.status(201).json({
      status: "pending",
      message:
        "Verification code sent to your email. Please verify to activate your account.",
      user: newJobSeeker,
      role: "job_seeker",
    });
  }
);

// ====== Verify Email ======
export const verifyEmailJobSeekers = asyncHandler(
  async (req: VerifyEmailRequest, res: Response, next: NextFunction) => {
    const { email, verificationCode } = req.body;

    const jobSeeker = await JobSeekers.findOne({
      email,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!jobSeeker)
      return next(new ApiError("Verification code invalid or expired", 400));

    const isValid = await bcrypt.compare(
      verificationCode,
      jobSeeker.emailVerificationCode
    );
    if (!isValid)
      return next(new ApiError("Verification code invalid or expired", 400));

    jobSeeker.verified = true;
    jobSeeker.emailVerificationCode = undefined;
    jobSeeker.emailVerificationExpires = undefined;
    await jobSeeker.save();

    res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  }
);

// ====== Login (only for verified users) ======
export const loginJobSeekers = asyncHandler(
  async (req: LoginRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const jobSeeker = await JobSeekers.findOne({ email });
    if (!jobSeeker) return next(new ApiError("Incorrect email", 401));

    if (!jobSeeker.verified)
      return next(
        new ApiError("Please verify your email before logging in", 401)
      );

    const passwordMatch = await bcrypt.compare(password, jobSeeker.password);
    if (!passwordMatch) return next(new ApiError("Incorrect password", 401));

    const token = createToken(jobSeeker._id);
    jobSeeker.password = undefined;

    res.status(200).json({
      status: "success",
      message: "Login successful",
      jobSeeker,
      token,
    });
  }
);

// ====== Forgot Password ======
export const forgotPasswordJobSeekers = asyncHandler(
  async (req: ForgotPasswordRequest, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const jobSeeker = await JobSeekers.findOne({ email });
    if (!jobSeeker)
      return next(new ApiError("No account found with this email", 404));

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = await bcrypt.hash(resetCode, 10);

    jobSeeker.passwordResetCode = hashedResetCode;
    jobSeeker.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    jobSeeker.resetCodeVerified = false;

    await jobSeeker.save();

    const message = `Hello ${jobSeeker.name},\n\nYour password reset code is: ${resetCode}\nThis code will expire in 10 minutes.\n\nLinkedOut Team`;

    await sendEmail({
      email: jobSeeker.email,
      subject: "SmartPOS Password Reset Code",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Reset code sent to your email",
    });
  }
);

// ====== Verify Password Reset Code ======
export const verifyPasswordResetCodeJobSeekers = asyncHandler(
  async (req: ResetCodeRequest, res: Response, next: NextFunction) => {
    const { email, resetCode } = req.body;

    const jobSeeker = await JobSeekers.findOne({
      email,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!jobSeeker)
      return next(new ApiError("Reset code invalid or expired", 400));

    const isValid = await bcrypt.compare(
      resetCode,
      jobSeeker.passwordResetCode
    );
    if (!isValid)
      return next(new ApiError("Reset code invalid or expired", 400));

    jobSeeker.resetCodeVerified = true;
    await jobSeeker.save();

    res.status(200).json({
      status: "success",
      message: "Code verified successfully",
    });
  }
);

// ====== Reset Password ======
export const resetPasswordJobSeekers = asyncHandler(
  async (req: ResetPasswordRequest, res: Response, next: NextFunction) => {
    const { email, newPassword } = req.body;

    const jobSeeker = await JobSeekers.findOne({ email });
    if (!jobSeeker)
      return next(new ApiError(`No job seeker found with email ${email}`, 404));

    if (!jobSeeker.resetCodeVerified)
      return next(new ApiError("Reset code not verified", 400));

    const hashedPassword = await bcrypt.hash(newPassword, 10);

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
  }
);
