const express = require("express");
const multer = require("multer");

const upload = multer();
const {
  login,
  forgotPasswordPos,
  resetPasswordPos,
  verifyPasswordResetCodePos,
} = require("../services/authService");
const { checkUserSubsicreber } = require("../middlewares/checkUserSubsicreber");

const router = express.Router();

router.post("/check", checkUserSubsicreber);
router.post("/login", upload.none(), login);
router.post(
  "/forgotpasswordspos",
  upload.none(),
  checkUserSubsicreber,
  forgotPasswordPos
);
router.post("/verifyresetcodepos", verifyPasswordResetCodePos);
router.put(
  "/resetpasswordpos",
  upload.none(),
  checkUserSubsicreber,
  resetPasswordPos
);

module.exports = router;
