import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import ApiError from "../utils/apiError";
import createToken from "../utils/createToken";
import { getDashboardRoles } from "./roleDashboardServices";
import sendEmail from "../utils/sendEmail";

import Employee from "../models/employeeModel";
import Roles from "../models/roleModel";
import { IEmployee } from "../models/interfaces/employee";

type AsyncRequestHandler<T = any> = (
  req: Request & T,
  res: Response,
  next: NextFunction
) => Promise<any>;

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
    companyId: string;
  };
}

interface AuthenticatedRequest extends Request {
  user?: IEmployee;
  query: {
    companyId?: string;
  };
}

interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
  query: {
    companyId?: string;
  };
}

interface ResetCodeRequest extends Request {
  body: {
    resetCode: string;
  };
  query: {
    companyId?: string;
  };
}

interface ResetPasswordRequest extends Request {
  body: {
    email: string;
    newPassword: string;
  };
  query: {
    companyId?: string;
  };
}

// @desc      Login
// @route     POST /api/auth/login
// @access    Public
export const login = asyncHandler(
  async (req: LoginRequest, res: Response, next: NextFunction) => {
    try {
      // Fetch the user and check email and password in parallel
      const user = await Employee.findOne({
        email: req.body.email,
        company: { $elemMatch: { companyId: req.body.companyId } },
      })
        .populate({
          path: "company.selectedRoles",
        })
        .populate({
          path: "salesPoint",
          populate: {
            path: "salesPointCurrency",
            model: "Currency",
          },
        });

      if (!user) {
        return next(new ApiError("Incorrect email", 401));
      }

      // Check password
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!passwordMatch) {
        return next(new ApiError("Incorrect Password", 401));
      }

      // Check if the user is active
      if (user.archives === "true") {
        return next(new ApiError("The account is not active", 401));
      }

      // Remove the password and pin from the user object
      user.password = undefined;
      user.pin = undefined;

      // Fetch roles in parallel
      const selectedCompany = user.company?.find(
        (c) => c.companyId === req.body.companyId
      );

      const roles = await Roles.findOne({
        _id: selectedCompany?.selectedRoles,
        companyId: req.body.companyId,
      });

      if (!roles) {
        return next(new ApiError("No roles found for this user", 404));
      }

      const [dashRoleName] = await Promise.all([
        getDashboardRoles(roles.rolesDashboard, req.body.companyId),
      ]);

      const token = createToken(user._id);
      res.status(200).json({
        status: "true",
        data: user,
        dashBoardRoles: dashRoleName,
        token,
        companyId: req.body.companyId,
      });
    } catch (error) {
      console.error("Error during login:", error);
      next(error);
    }
  }
);

// @desc   make sure the user is logged in sys
export const protect = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const companyId = req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new ApiError("Not login", 401));
    }

    try {
      // Verify token (no change happens, expired token)
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY as string
      ) as { userId: string };

      // Check if user exists
      const currentUser = await Employee.findOne({
        _id: decoded.userId,
        company: {
          $elemMatch: { companyId: companyId },
        },
      });

      if (!currentUser) {
        return next(new ApiError("The user does not exist", 404));
      }

      req.user = currentUser;
      next();
    } catch (error: any) {
      // Token verification failed
      console.error("JWT Error:", error.message);
      if (error.name === "TokenExpiredError") {
        return next(new ApiError("Token has expired", 401));
      } else {
        console.error("JWT Error:", error.message);
        return next(new ApiError("Not login", 401));
      }
    }
  }
);

// @desc      Forgot password
// @route     POST /api/auth/forgotpasswordpos
// @access    Public
export const forgotPasswordPos = asyncHandler(
  async (req: ForgotPasswordRequest, res: Response, next: NextFunction) => {
    const companyId = req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    // 1) Get user by email
    const { email } = req.body;
    const user = await Employee.findOne({ email, companyId });
    if (!user) {
      return next(
        new ApiError(`There is no user with this email address ${email}`, 404)
      );
    }

    // 2) Generate random reset code and save it in db
    const resetCode = Math.floor(Math.random() * 1000000 + 1).toString();
    // Encrypt the reset code before saving it in db (Security)
    const hashedResetCode = await bcrypt.hash(resetCode, 10);

    user.passwordResetCode = hashedResetCode;
    // 10 min
    user.passwordResetExpires = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();
    user.resetCodeVerified = false;

    await user.save();

    // 3) Send password reset code via email
    const message = `Forgot your password? Submit this reset password code: ${resetCode}\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your Password Reset Code (valid for 10 min)",
        message,
      });

      res.status(200).json({
        status: "Success",
        message: "Reset code sent to your email",
      });
    } catch (err) {
      // If there's an error sending the email, clear the reset code and expiration time
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.log(err);
      return next(
        new ApiError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  }
);

// @desc      Verify reset password code
// @route     POST /api/auth/verifyresetcodepos
// @access    Public
export const verifyPasswordResetCodePos = asyncHandler(
  async (req: ResetCodeRequest, res: Response, next: NextFunction) => {
    const companyId = req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const { resetCode } = req.body;

    const user = await Employee.findOne({
      passwordResetExpires: { $gt: new Date() },
      companyId,
    });

    if (!user) {
      return next(new ApiError("Reset code is invalid or has expired", 400));
    }

    if (!user.passwordResetCode) {
      return next(new ApiError("No reset code found", 400));
    }

    // 3) Compare the reset code with the hashed code stored in the database
    const isResetCodeValid = await bcrypt.compare(
      resetCode,
      user.passwordResetCode
    );

    if (!isResetCodeValid) {
      return next(new ApiError("Reset code is invalid or has expired", 400));
    }

    // 4) Mark reset code as verified
    user.resetCodeVerified = true;
    await user.save();

    res.status(200).json({
      status: "Success",
    });
  }
);

// @desc      Reset password
// @route     POST /api/auth/resetpasswordpos
// @access    Public
export const resetPasswordPos = asyncHandler(
  async (req: ResetPasswordRequest, res: Response, next: NextFunction) => {
    const companyId = req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    // 1) Get user based on email
    const user = await Employee.findOne({
      email: req.body.email,
      companyId,
    });

    if (!user) {
      return next(
        new ApiError(
          `There is no user with this email address ${req.body.email}`,
          404
        )
      );
    }

    // Check if user verify the reset code
    if (!user.resetCodeVerified) {
      return next(new ApiError("reset code not verified", 400));
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);

    // 2) Update user password & Hide passwordResetCode & passwordResetExpires from the result
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.resetCodeVerified = undefined;

    await user.save();

    // 3) If everything ok, send token to client
    const token = createToken(user._id);

    res.status(200).json({ user: user, token });
  }
);
