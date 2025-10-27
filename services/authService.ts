import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import ApiError from "../utils/apiError";
import createToken from "../utils/createToken";
import Employee from "../models/employeeModel";
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

// @desc      Login
// @route     POST /api/auth/login
// @access    Public
export const login = asyncHandler(
  async (req: LoginRequest, res: Response, next: NextFunction) => {
    try {
      // Fetch the user and check email and password in parallel
      const user = await Employee.findOne({
        email: req.body.email,
      })
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




      const token = createToken(user._id);
      res.status(200).json({
        status: "true",
        data: user,
        token,
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




// @desc      Verify reset password code
// @route     POST /api/auth/verifyresetcodepos
// @access    Public
export const verifyPasswordResetCodePos = asyncHandler(
  async (req: ResetCodeRequest, res: Response, next: NextFunction) => {

    const { resetCode } = req.body;

    const user = await Employee.findOne({
      passwordResetExpires: { $gt: new Date() },
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

    // 1) Get user based on email
    const user = await Employee.findOne({
      email: req.body.email,
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
