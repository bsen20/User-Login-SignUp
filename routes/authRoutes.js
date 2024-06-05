const express = require("express");
const {
  registerUser,
  verifyEmail,
  loginUser,
  verifyOtpAndLogin,
} = require("../controllers/authController");
const router = express.Router();

router.post("/register", registerUser);
router.get("/verify-email", verifyEmail);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtpAndLogin);

module.exports = router;
