const express = require("express");
const multer = require("multer");

const upload = multer();
const {
  login,
  resetPasswordPos,
  verifyPasswordResetCodePos,
  forgotPassword,
  createEmployee,
  reSendPassword,
  processEmployeeImage,
  uploadEmployeeImage,
} = require("../services/employeeAuthService");
const {
  forgotPasswordJobSeekers,
  loginJobSeekers,
  resetPasswordJobSeekers,
  signupJobSeekers,
  verifyPasswordResetCodeJobSeekers,
  verifyEmailJobSeekers,
  googleLogin,
  processJobSeekerFiles,
  uploadJobSeekerFiles,
} = require("../services/jobSeekersAuthService");

const router = express.Router();

//employee

router.post("/login", login);
router.post("/verifyresetcodepos", verifyPasswordResetCodePos);
router.post("/forgotPassword", forgotPassword);
router.post(
  "/createEmployee",
  uploadEmployeeImage,
  processEmployeeImage,
  createEmployee
);
router.post("/reSendPassword", reSendPassword);
router.put("/resetpasswordpos", resetPasswordPos);

//job seekers

router.post(
  "/signupSeekers",
  uploadJobSeekerFiles,
  processJobSeekerFiles,
  signupJobSeekers
);
router.post("/loginSeekers", loginJobSeekers);
router.post(
  "/verifyPasswordResetCodeSeekers",
  verifyPasswordResetCodeJobSeekers
);
router.post("/googleLogin", googleLogin);

router.post("/forgotPasswordSeekers", forgotPasswordJobSeekers);
router.post("/verifyEmailJobSeekers", verifyEmailJobSeekers);
router.put("/resetPasswordSeekers", resetPasswordJobSeekers);

module.exports = router;
