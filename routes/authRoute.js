const express = require("express");
const multer = require("multer");

const upload = multer();
const {
  login,
  resetPasswordPos,
  verifyPasswordResetCodePos,
  forgotPassword,
  signup,
} = require("../services/employeeAuthService");
const {
  forgotPasswordJobSeekers,
  loginJobSeekers,
  resetPasswordJobSeekers,
  signupJobSeekers,
  verifyPasswordResetCodeJobSeekers,
  verifyEmailJobSeekers,
  googleLogin,
} = require("../services/jobSeekersAuthService");

const router = express.Router();

router.post("/login", upload.none(), login);
router.post("/verifyresetcodepos", verifyPasswordResetCodePos);
router.post("/forgotPassword", forgotPassword);
router.post("/signup", signup);
router.put("/resetpasswordpos", upload.none(), resetPasswordPos);

//job seekers

router.post("/loginSeekers", upload.none(), loginJobSeekers);
router.post(
  "/verifyPasswordResetCodeSeekers",
  verifyPasswordResetCodeJobSeekers
);
router.post("/googleLogin", googleLogin);

router.post("/forgotPasswordSeekers", forgotPasswordJobSeekers);
router.post("/signupSeekers", signupJobSeekers);
router.post("/verifyEmailJobSeekers", verifyEmailJobSeekers);
router.put("/resetPasswordSeekers", upload.none(), resetPasswordJobSeekers);

module.exports = router;
