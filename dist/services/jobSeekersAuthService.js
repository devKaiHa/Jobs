"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get forgotPasswordJobSeekers() {
    return forgotPasswordJobSeekers;
  },
  get googleLogin() {
    return googleLogin;
  },
  get loginJobSeekers() {
    return loginJobSeekers;
  },
  get processJobSeekerFiles() {
    return processJobSeekerFiles;
  },
  get protect() {
    return protect;
  },
  get resetPasswordJobSeekers() {
    return resetPasswordJobSeekers;
  },
  get signupJobSeekers() {
    return signupJobSeekers;
  },
  get uploadJobSeekerFiles() {
    return uploadJobSeekerFiles;
  },
  get verifyEmailJobSeekers() {
    return verifyEmailJobSeekers;
  },
  get verifyPasswordResetCodeJobSeekers() {
    return verifyPasswordResetCodeJobSeekers;
  },
});
const _expressasynchandler = /*#__PURE__*/ _interop_require_default(
  require("express-async-handler")
);
const _jsonwebtoken = /*#__PURE__*/ _interop_require_default(
  require("jsonwebtoken")
);
const _bcrypt = /*#__PURE__*/ _interop_require_default(require("bcrypt"));
const _apiError = /*#__PURE__*/ _interop_require_default(
  require("../../utils/apiError")
);
const _createToken = /*#__PURE__*/ _interop_require_default(
  require("../../utils/createToken")
);
const _jobSeekersModel = /*#__PURE__*/ _interop_require_default(
  require("../models/jobSeekersModel")
);
const _sendEmail = /*#__PURE__*/ _interop_require_default(
  require("../../utils/sendEmail")
);
const _googleauthlibrary = require("google-auth-library");
const _multer = /*#__PURE__*/ _interop_require_default(require("multer"));
const _sharp = /*#__PURE__*/ _interop_require_default(require("sharp"));
const _uuid = require("uuid");
function _interop_require_default(obj) {
  return obj && obj.__esModule
    ? obj
    : {
        default: obj,
      };
}
const multerStorage = _multer.default.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype === "application/pdf" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword"
  ) {
    cb(null, true);
  } else {
    cb(
      new _apiError.default("Only images or CV files are allowed", 400),
      false
    );
  }
};
const upload = (0, _multer.default)({
  storage: multerStorage,
  fileFilter: multerFilter,
});
const uploadJobSeekerFiles = upload.fields([
  {
    name: "profileImage",
    maxCount: 1,
  },
  {
    name: "cv",
    maxCount: 1,
  },
  {
    name: "licenses",
    maxCount: 1,
  },
]);
const processJobSeekerFiles = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    if (req.files && req.files.profileImage) {
      const imageFile = req.files.profileImage[0];
      const imageFilename = `profileImage-${(0, _uuid.v4)()}-${Date.now()}.png`;
      await (0, _sharp.default)(imageFile.buffer)
        .toFormat("png")
        .png({
          quality: 70,
        })
        .toFile(`uploads/jobSeekers/${imageFilename}`);
      req.body.profileImage = imageFilename;
    }
    //  Process CV file
    if (req.files && req.files.cv) {
      const cvFile = req.files.cv[0];
      const cvExt = cvFile.mimetype.split("/")[1] || "pdf"; // get file extension
      const cvFilename = `cv-${(0, _uuid.v4)()}-${Date.now()}.${cvExt}`;
      const fs = require("fs");
      fs.writeFileSync(`uploads/cv/${cvFilename}`, cvFile.buffer);
      req.body.cv = cvFilename;
    }
    if (req.files && req.files.licenses) {
      const licenseFile = req.files.licenses[0];
      const licenseExt = licenseFile.mimetype.split("/")[1] || "pdf";
      const licenseFilename = `license-${(0,
      _uuid.v4)()}-${Date.now()}.${licenseExt}`;
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
const client = new _googleauthlibrary.OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);
const googleLogin = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload)
      return next(new _apiError.default("Google token not valid", 400));
    const { email, name, picture } = payload;
    let jobSeeker = await _jobSeekersModel.default.findOne({
      email,
    });
    if (!jobSeeker) {
      jobSeeker = await _jobSeekersModel.default.create({
        name,
        email,
        verified: true,
        profileImage: picture,
        password: Math.random().toString(36).slice(-8),
      });
    }
    const jwtToken = (0, _createToken.default)(jobSeeker._id);
    res.status(200).json({
      status: "success",
      message: "Logged in with Google successfully",
      jobSeeker,
      token: jwtToken,
    });
  }
);
const protect = (0, _expressasynchandler.default)(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return next(new _apiError.default("Not logged in", 401));
  try {
    const decoded = _jsonwebtoken.default.verify(
      token,
      process.env.JWT_SECRET_KEY
    );
    const currentUser = await _jobSeekersModel.default.findById(decoded.userId);
    if (!currentUser)
      return next(new _apiError.default("JobSeeker does not exist", 404));
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return next(new _apiError.default("Token has expired", 401));
    return next(new _apiError.default("Not logged in", 401));
  }
});
const signupJobSeekers = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { name, email, password } = req.body;
    const existingJobSeeker = await _jobSeekersModel.default.findOne({
      email,
    });
    if (existingJobSeeker)
      return next(new _apiError.default("Email already registered", 400));
    const hashedPassword = await _bcrypt.default.hash(password, 10);
    // Generate email verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const hashedVerificationCode = await _bcrypt.default.hash(
      verificationCode,
      10
    );
    const newJobSeeker = await _jobSeekersModel.default.create({
      ...req.body,
      name,
      password: hashedPassword,
      active: false,
      emailVerificationCode: hashedVerificationCode,
      emailVerificationExpires: Date.now() + 10 * 60 * 1000,
    });
    // Send verification email
    const message = `Hello ${name},\n\nYour email verification code is: ${verificationCode}\nThis code will expire in 10 minutes.\n\nThank you,\nSmartPOS Team`;
    await (0, _sendEmail.default)({
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
const verifyEmailJobSeekers = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { email, verificationCode } = req.body;
    const jobSeeker = await _jobSeekersModel.default.findOne({
      email,
      emailVerificationExpires: {
        $gt: new Date(),
      },
    });
    if (!jobSeeker)
      return next(
        new _apiError.default("Verification code invalid or expired", 400)
      );
    const isValid = await _bcrypt.default.compare(
      verificationCode,
      jobSeeker.emailVerificationCode
    );
    if (!isValid)
      return next(
        new _apiError.default("Verification code invalid or expired", 400)
      );
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
const loginJobSeekers = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { email, password } = req.body;
    const jobSeeker = await _jobSeekersModel.default.findOne({
      email,
    });
    if (!jobSeeker) return next(new _apiError.default("Incorrect email", 401));
    if (!jobSeeker.verified)
      return next(
        new _apiError.default("Please verify your email before logging in", 401)
      );
    const passwordMatch = await _bcrypt.default.compare(
      password,
      jobSeeker.password
    );
    if (!passwordMatch)
      return next(new _apiError.default("Incorrect password", 401));
    const token = (0, _createToken.default)(jobSeeker._id);
    jobSeeker.password = undefined;
    res.status(200).json({
      status: "success",
      message: "Login successful",
      jobSeeker,
      token,
    });
  }
);
const forgotPasswordJobSeekers = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { email } = req.body;
    const jobSeeker = await _jobSeekersModel.default.findOne({
      email,
    });
    if (!jobSeeker)
      return next(
        new _apiError.default("No account found with this email", 404)
      );
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = await _bcrypt.default.hash(resetCode, 10);
    jobSeeker.passwordResetCode = hashedResetCode;
    jobSeeker.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    jobSeeker.resetCodeVerified = false;
    await jobSeeker.save();
    const message = `Hello ${jobSeeker.name},\n\nYour password reset code is: ${resetCode}\nThis code will expire in 10 minutes.\n\nLinkedOut Team`;
    await (0, _sendEmail.default)({
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
const verifyPasswordResetCodeJobSeekers = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { email, resetCode } = req.body;
    const jobSeeker = await _jobSeekersModel.default.findOne({
      email,
      passwordResetExpires: {
        $gt: new Date(),
      },
    });
    if (!jobSeeker)
      return next(new _apiError.default("Reset code invalid or expired", 400));
    const isValid = await _bcrypt.default.compare(
      resetCode,
      jobSeeker.passwordResetCode
    );
    if (!isValid)
      return next(new _apiError.default("Reset code invalid or expired", 400));
    jobSeeker.resetCodeVerified = true;
    await jobSeeker.save();
    res.status(200).json({
      status: "success",
      message: "Code verified successfully",
    });
  }
);
const resetPasswordJobSeekers = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { email, newPassword } = req.body;
    const jobSeeker = await _jobSeekersModel.default.findOne({
      email,
    });
    if (!jobSeeker)
      return next(
        new _apiError.default(`No job seeker found with email ${email}`, 404)
      );
    if (!jobSeeker.resetCodeVerified)
      return next(new _apiError.default("Reset code not verified", 400));
    const hashedPassword = await _bcrypt.default.hash(newPassword, 10);
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
