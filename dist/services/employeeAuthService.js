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
  get createEmployee() {
    return createEmployee;
  },
  get forgotPassword() {
    return forgotPassword;
  },
  get login() {
    return login;
  },
  get processEmployeeImage() {
    return processEmployeeImage;
  },
  get protect() {
    return protect;
  },
  get reSendPassword() {
    return reSendPassword;
  },
  get resetPasswordPos() {
    return resetPasswordPos;
  },
  get uploadEmployeeImage() {
    return uploadEmployeeImage;
  },
  get verifyPasswordResetCodePos() {
    return verifyPasswordResetCodePos;
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
const _employeeModel = /*#__PURE__*/ _interop_require_default(
  require("../models/employeeModel")
);
const _sendEmail = /*#__PURE__*/ _interop_require_default(
  require("../../utils/sendEmail")
);
const _isEmail = /*#__PURE__*/ _interop_require_default(
  require("../../utils/tools/isEmail")
);
const _generatePassword = /*#__PURE__*/ _interop_require_default(
  require("../../utils/tools/generatePassword")
);
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
// image filter
const multerFilter = (req, file, cb) => {
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
const upload = (0, _multer.default)({
  storage: multerStorage,
  fileFilter: multerFilter,
});
const uploadEmployeeImage = upload.fields([
  {
    name: "image",
    maxCount: 1,
  },
]);
const processEmployeeImage = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    if (req.files && req.files.image) {
      const imageFile = req.files.image[0];
      const imageFilename = `image-${(0, _uuid.v4)()}-${Date.now()}.png`;
      await (0, _sharp.default)(imageFile.buffer)
        .toFormat("png")
        .png({
          quality: 70,
        })
        .toFile(`uploads/employee/${imageFilename}`);
      req.body.image = imageFilename;
    }
    next();
  }
);
const createEmployee = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const email = req.body.email;
    const name = req.body.name;
    const findEmployee = await _employeeModel.default.findOne({
      email,
    });
    //Check if the email format is true or not
    if ((0, _isEmail.default)(email)) {
      //Generate Password
      const employeePass = (0, _generatePassword.default)();
      let employee;
      //Send password to email
      if (!findEmployee) {
        req.body.password = await _bcrypt.default.hash(employeePass, 12);
        await (0, _sendEmail.default)({
          email: req.body.email,
          subject: "New Password",
          message: `Hello ${req.body.name}, Your password is ${employeePass}`,
        });
        employee = await _employeeModel.default.create(req.body);
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
      return next(
        new _apiError.default("There is an error in email format", 500)
      );
    }
  }
);
const reSendPassword = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const email = req.body.email;
    //Check if the email format is true or not
    const findEmployee = await _employeeModel.default.findOne({
      email: req.body.email,
    });
    if (!findEmployee) {
      res.status(400).json({
        status: false,
        message: "Email not found",
      });
    }
    try {
      //Generate Password
      const employeePass = (0, _generatePassword.default)();
      const hashedPassword = await _bcrypt.default.hash(employeePass, 12);
      req.body.password = hashedPassword;
      //Sned password to email
      await (0, _sendEmail.default)({
        email: req.body.email,
        subject: "New Password",
        message: `Hello ${findEmployee.name}, Your password is ${employeePass}`,
      });
      const employee = await _employeeModel.default.findOneAndUpdate(
        {
          email: email,
        },
        {
          password: hashedPassword,
        },
        {
          new: true,
        }
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
const login = (0, _expressasynchandler.default)(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await _employeeModel.default.findOne({
    email,
  });
  if (!user) return next(new _apiError.default("Incorrect email", 401));
  const passwordMatch = await _bcrypt.default.compare(password, user.password);
  if (!passwordMatch)
    return next(new _apiError.default("Incorrect password", 401));
  if (user.archives === "true")
    return next(new _apiError.default("Account is not active", 401));
  const token = (0, _createToken.default)(user._id);
  user.password = undefined;
  res.status(200).json({
    status: "success",
    message: "Login successful ✅",
    user,
    token,
  });
});
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
    console.log("decoded", decoded);
    const currentUser = await _employeeModel.default.findOne({
      email: decoded.email,
    });
    if (!currentUser)
      return next(new _apiError.default("Employee does not exist", 404));
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return next(new _apiError.default("Token has expired", 401));
    return next(new _apiError.default("Not logged in", 401));
  }
});
const forgotPassword = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { email } = req.body;
    const user = await _employeeModel.default.findOne({
      email,
    });
    if (!user)
      return next(
        new _apiError.default("No account found with this email", 404)
      );
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = await _bcrypt.default.hash(resetCode, 10);
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
const verifyPasswordResetCodePos = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { email, resetCode } = req.body;
    const user = await _employeeModel.default.findOne({
      email,
      passwordResetExpires: {
        $gt: new Date(),
      },
    });
    if (!user)
      return next(new _apiError.default("Reset code invalid or expired", 400));
    if (!user.passwordResetCode)
      return next(new _apiError.default("No reset code found", 400));
    const isValid = await _bcrypt.default.compare(
      resetCode,
      user.passwordResetCode
    );
    if (!isValid)
      return next(new _apiError.default("Reset code invalid or expired", 400));
    user.resetCodeVerified = true;
    await user.save();
    res.status(200).json({
      status: "success",
      message: "Code verified",
    });
  }
);
const resetPasswordPos = (0, _expressasynchandler.default)(
  async (req, res, next) => {
    const { email, newPassword } = req.body;
    const user = await _employeeModel.default.findOne({
      email,
    });
    if (!user)
      return next(
        new _apiError.default(`No employee found with email ${email}`, 404)
      );
    if (!user.resetCodeVerified)
      return next(new _apiError.default("Reset code not verified", 400));
    const hashedPassword = await _bcrypt.default.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.resetCodeVerified = undefined;
    await user.save();
    const token = (0, _createToken.default)(user._id);
    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
      user,
      token,
    });
  }
);
