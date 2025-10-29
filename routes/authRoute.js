const express = require("express");
const multer = require("multer");

const upload = multer();
const {
  login,
  resetPasswordPos,
  verifyPasswordResetCodePos,
  forgotPassword,
  signup,
  verifyTwoFactor,
} = require("../services/employeeAuthService");
const {
  forgotPasswordUser,
  loginUser,
  resetPasswordUser,
  signupUser,
  verifyPasswordResetCodeUser,
  verifyTwoFactorUser,
} = require("../services/userAuthService");

const router = express.Router();

router.post("/login", upload.none(), login);
router.post("/verifyTwoFactor", verifyTwoFactor);
router.post("/verifyresetcodepos", verifyPasswordResetCodePos);
router.post("/forgotPassword", forgotPassword);
router.post("/signup", signup);
router.put("/resetpasswordpos", upload.none(), resetPasswordPos);

//user

router.post("/loginUser", upload.none(), loginUser);
router.post("/verifyTwoFactorUser", verifyTwoFactorUser);
router.post("/verifyPasswordResetCodeUser", verifyPasswordResetCodeUser);
router.post("/forgotPasswordUser", forgotPasswordUser);
router.post("/signupUser", signupUser);
router.put("/resetPasswordUser", upload.none(), resetPasswordUser);

module.exports = router;
