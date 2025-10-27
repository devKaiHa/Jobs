const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const createToken = require("../utils/createToken");
const { getDashboardRoles } = require("./roleDashboardServices");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const employeeModel = require("../models/employeeModel");
const rolesModel = require("../models/roleModel");
const sendEmail = require("../utils/sendEmail");

// @desc      Login
// @route     POST /api/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  try {
    // Fetch the user and check email and password in parallel

    const user = await employeeModel
      .findOne({
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
    const selectedCompany = user.company.find(
      (c) => c.companyId === req.body.companyId
    );

    const roles = await rolesModel.findOne({
      _id: selectedCompany?.selectedRoles,
      companyId: req.body.companyId,
    });
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
});

// @desc   make sure the user is logged in sys
exports.protect = asyncHandler(async (req, res, next) => {
  const companyId = req.query.companyId;

  if (!companyId) {
    return res.status(400).json({ message: "companyId is required" });
  }

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ApiError("Not login", 401));
  } else {
    try {
      //2- Verify token (no change happens, expired token)
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      //3-Check if user exists

      const curentUser = await employeeModel.findOne({
        _id: decoded.userId,
        company: {
          $elemMatch: { companyId: companyId },
        },
      });

      if (!curentUser) {
        return next(new ApiError("The user does not exit", 404));
      }
      req.user = curentUser;
      next();
    } catch (error) {
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
});

// @desc      Forgot password
// @route     POST /api/auth/forgotpasswordpos
// @access    Public
exports.forgotPasswordPos = asyncHandler(async (req, res, next) => {
  const companyId = req.query.companyId;

  if (!companyId) {
    return res.status(400).json({ message: "companyId is required" });
  }

  // 1) Get user by email
  const { email } = req.body;
  const user = await employeeModel.findOne({ email, companyId });
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
  //10 min
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  user.resetCodeVerified = false;
  await user.save();

  // 3) Send password reset code via email
  const message = `Forgot your password? Submit this reset password code: ${resetCode}\n If you didn't forget your password, please ignore this email!`;

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
});

// @desc      Verify reset password code
// @route     POST /api/auth/verifyresetcodepos
// @access    Public
exports.verifyPasswordResetCodePos = asyncHandler(async (req, res, next) => {
  const companyId = req.query.companyId;

  if (!companyId) {
    return res.status(400).json({ message: "companyId is required" });
  }

  const { resetCode } = req.body;

  const user = await employeeModel.find({
    passwordResetExpires: { $gt: Date.now() },
    companyId,
  });
  if (!user) {
    return next(new ApiError("Reset code is invalid or has expired", 400));
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
});

// @desc      Reset password
// @route     POST /api/auth/resetpasswordpos
// @access    Public
exports.resetPasswordPos = asyncHandler(async (req, res, next) => {
  const companyId = req.query.companyId;

  if (!companyId) {
    return res.status(400).json({ message: "companyId is required" });
  }
  // 1) Get user based on email
  const user = await employeeModel.findOne({
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
  const hashedResetCode = await bcrypt.hash(req.body.newPassword, 10);

  // 2) Update user password & Hide passwordResetCode & passwordResetExpires from the result
  user.password = hashedResetCode;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.resetCodeVerified = undefined;
  await user.save();

  // 3) If everything ok, send token to client
  const token = createToken(user._id);

  res.status(200).json({ user: user, token });
});
