const express = require("express");
const multer = require("multer");

const upload = multer();
const {
  login,
  resetPasswordPos,
  verifyPasswordResetCodePos,
  forgotPassword,
  signup,
} = require("../services/authService");

const router = express.Router();

router.post("/login", upload.none(), login);
router.post("/verifyresetcodepos", verifyPasswordResetCodePos);
router.post("/forgotPassword", forgotPassword);
router.post("/signup", signup);
router.put("/resetpasswordpos", upload.none(), resetPasswordPos);

module.exports = router;
