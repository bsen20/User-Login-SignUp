const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const sendOtpOnEmail = async (user, res) => {
  try {
    const otp = otpGenerator.generate(6, {
      specialChars: false,
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
    });
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    console.log(otp);

    await sendEmail(
      user.email,
      "Your OTP Code",
      `Your 2-step authentication OTP code is :\n ${otp}`
    );

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Someting weng wrong" });
  }
};

const sendVerificationEmail = async (user, res) => {
  try {
    const verificationToken = generateToken(user._id);

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail(
      user.email,
      "Email Verification",
      `Please verify your email by clicking this link: ${verificationUrl}`
    );
    res.status(201).json({
      message: "User registered. Please verify your email.",
      verificationToken,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Someting went wrong" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ email, password });

    await sendVerificationEmail(user, res);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Someting went wrong" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    user.isVerified = true;
    await user.save();
    console.log("User Verified");
    res.status(200).json({ message: "Email verified" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Someting went wrong" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return await sendVerificationEmail(user, res);
      //return res.status(401).json({ message: "Please verify your email" });
    } else {
      return await sendOtpOnEmail(user, res);
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Someting went wrong" });
  }
};

const verifyOtpAndLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Someting went wrong" });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  verifyOtpAndLogin,
};
