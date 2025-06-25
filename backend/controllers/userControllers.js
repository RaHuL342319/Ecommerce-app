import bcryptjs from "bcryptjs";
import UserModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import sendEmailFun from "../utils/sendEmailFun.js";
import { verificationEmailTemplate } from "../utils/VerificationEmailTemplate.js";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { forgotEmailTemplate } from "../utils/forgotEmailTemplate.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
});

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user;
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide email, name, password",
        error: true,
        success: false,
      });
    }

    // Check if user already exists
    user = await UserModel.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User already exists with this email",
        error: true,
        success: false,
      });
    }

    // OTP generation for mobile verification
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create new user
    user = new UserModel({
      name,
      email,
      password: hashedPassword,
      otp: verifyCode,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
    });

    // Save user to database
    await user.save();

    // Send verification email (not implemented here)
    await sendEmailFun({
      to: email,
      subject: "Verify email from E-commerce App",
      text: "",
      html: verificationEmailTemplate({
        name,
        verifyCode,
      }),
    });

    // generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "30d" }
    );

    res.status(200).json({
      success: true,
      error: false,
      message: "User registered successfully, please verify your email",
      token: token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
};

// Verify user email
export const verifyUserEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        message: "Please provide email and OTP",
        error: true,
        success: false,
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    console.log("User found for verification:", user);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    // Check if OTP is valid and not expired
    const isValidOtp = user.otp === otp;
    const isOtpExpired = user.otpExpires > Date.now();

    if (isValidOtp && isOtpExpired) {
      // Mark user as verified
      user.emailVerified = true;
      user.otp = null; // Clear OTP after verification
      user.otpExpires = null; // Clear OTP expiration
      await user.save();
    } else if (!isValidOtp) {
      return res.status(400).json({
        message: "Invalid OTP",
        error: true,
        success: false,
      });
    } else if (isOtpExpired) {
      return res.status(400).json({
        message: "OTP has expired.",
        error: true,
        success: false,
      });
    }

    res.status(200).json({
      success: true,
      error: false,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error verifying user email:", error);
    res
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
        error: true,
        success: false,
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    console.log("User found:", user);
    if (!user) {
      return res.status(404).json({
        message: "User not Registered with this email",
        error: true,
        success: false,
      });
    }

    // Check if user is active
    if (user.status !== "Active") {
      return res.status(403).json({
        message: "User is not active, Contact to admin",
        error: true,
        success: false,
      });
    }

    // Check if user email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email first.",
        error: true,
        success: false,
      });
    }

    // Check if password matches
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Wrong password",
        error: true,
        success: false,
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email first.",
        error: true,
        success: false,
      });
    }

    // Generate JWT token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    await UserModel.findByIdAndUpdate(user?._id, {
      last_login_date: new Date(),
    });

    const cookiesOption = {
      httpOnly: true,
      secure: true, // Set to true if using HTTPS
      sameSite: "None", // Adjust based on your requirements
    };

    res.cookie("accessToken", accessToken, cookiesOption);
    res.cookie("refreshToken", refreshToken, cookiesOption);

    res.status(200).json({
      success: true,
      error: false,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is set in req.user by authentication middleware

    // Clear cookies
    const cookiesOption = {
      httpOnly: true,
      secure: true, // Set to true if using HTTPS
      sameSite: "None", // Adjust based on your requirements
    };

    res.clearCookie("accessToken", cookiesOption);
    res.clearCookie("refreshToken", cookiesOption);

    // Optionally, you can also clear the refresh token in the database
    await UserModel.findByIdAndUpdate(userId, {
      refresh_token: null,
    });

    res.status(200).json({
      success: true,
      error: false,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Error logging out user:", error);
    res
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
};

// IMAGE UPLOAD
let imagesArr = [];
export const userAvatarUpload = async (req, res) => {
  try {
    imagesArr = [];
    const userId = req.userId;
    const image = req.files;

    const user = await UserModel.findOne({ _id: userId });

    // if image is already uploaded, remove it
    const userAvatar = user?.avatar;
    if (userAvatar) {
      const urlArr = userAvatar.split("/");
      const imageName = urlArr[urlArr.length - 1].split(".")[0];
      if (imageName) {
        await cloudinary.uploader.destroy(imageName);
      }
    }
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    // Validate that at least one image is provided
    if (!image || image.length === 0) {
      return res.status(400).json({
        message: "Please provide at least one image",
        error: true,
        success: false,
      });
    }

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    for (let i = 0; i < image.length; i++) {
      const result = await cloudinary.uploader.upload(image[i].path, options);
      imagesArr.push(result.secure_url);
      fs.unlinkSync(image[i].path); // Remove local file after upload
    }

    // Optionally update user avatar in DB here
    user.avatar = imagesArr[0]; // Assuming you want to set the first image as avatar
    await user.save();

    return res.status(200).json({
      _id: userId,
      avatar: imagesArr[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const removeImagefromCloudinary = async (req, res) => {
  try {
    const imgURL = req.query.img;

    const urlArr = imgURL.split("/");
    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];

    if (imageName) {
      const res = await cloudinary.uploader.destroy(
        imageName,
        (error, result) => {}
      );
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is set in req.user by authentication middleware
    const { name, email, mobile, password } = req.body;

    const userExists = await UserModel.findOne({ _id: userId });
    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }
    // Update user profile fields
    let verifyCode = "";
    if (email !== userExists.email) {
      verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    let hashPassword = "";
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      hashPassword = await bcryptjs.hash(password, salt);
    } else {
      hashPassword = userExists.password; // Keep the existing password if not provided
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        name: name,
        email: email,
        mobile: mobile,
        emailVerified:
          email !== userExists.email ? false : userExists.emailVerified, // Only reset emailVerified if email is changed
        password: hashPassword,
        otp: verifyCode !== "" ? verifyCode : userExists.otp, // Update OTP if email is changed
        otpExpires:
          verifyCode !== ""
            ? new Date(Date.now() + 10 * 60 * 1000)
            : userExists.otpExpires, // Reset OTP expiration if OTP is updated
      },
      { new: true } // Return the updated document
    );

    // send verification email if email is changed
    if (email !== userExists.email) {
      await sendEmailFun({
        to: email,
        subject: "Verify email from E-commerce App",
        text: "",
        html: verificationEmailTemplate({
          name,
          verifyCode,
        }),
      });
    }
    res.status(200).json({
      success: true,
      error: false,
      message: "User profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        message: "Please provide email",
        error: true,
        success: false,
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
        error: true,
        success: false,
      });
    }

    // Generate OTP for password reset
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = verifyCode;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    await user.save();

    // Send verification email
    await sendEmailFun({
      to: email,
      subject: "Reset Password from E-commerce App",
      text: "",
      html: forgotEmailTemplate({
        name: user.name,
        verifyCode,
      }),
    });

    res.status(200).json({
      success: true,
      error: false,
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const validateForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        message: "Please provide email and OTP",
        error: true,
        success: false,
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
        error: true,
        success: false,
      });
    }

    // Check if OTP is valid and not expired
    const isValidOtp = user.otp === otp;
    const isOtpExpired = user.otpExpires > Date.now();

    if (isValidOtp && isOtpExpired) {
      res.status(200).json({
        success: true,
        error: false,
        message: "OTP is validated successfully",
      });
    } else if (!isValidOtp) {
      return res.status(400).json({
        message: "Invalid OTP",
        error: true,
        success: false,
      });
    } else if (isOtpExpired) {
      return res.status(400).json({
        message: "OTP has been expired.",
        error: true,
        success: false,
      });
    }
  } catch (error) {
    console.error("Error validating forgot password OTP:", error);
    res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    console.log(req.body);
    const { email, newPassword, confirmPassword } = req.body;
    // Validate required fields
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please provide email, new password, and confirm password",
        error: true,
        success: false,
      });
    }
    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
        error: true,
        success: false,
      });
    }
    // Find user by email
    const user = await UserModel.find({ email });
    if (!user || user.length === 0) {
      return res.status(404).json({
        message: "User not found with this email",
        error: true,
        success: false,
      });
    }

    // Hash the new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);
    // Update user's password
    await UserModel.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          otp: null, // Clear OTP after password reset
          otpExpires: null, // Clear OTP expiration
        },
      }
    );
    res.status(200).json({
      success: true,
      error: false,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.cookies || req.headers.authorization;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token is required",
        error: true,
        success: false,
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.SECRET_KEY_REFRESH_TOKEN
    );

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        message: "Invalid refresh token",
        error: true,
        success: false,
      });
    }
    const userId = decoded.userId;

    // Generate new access token
    const newAccessToken = generateAccessToken(userId);

    const cookiesOption = {
      httpOnly: true,
      secure: true, // Set to true if using HTTPS
      sameSite: "None", // Adjust based on your requirements
    };

    res.cookie("accessToken", newAccessToken, cookiesOption);

    res.status(200).json({
      success: true,
      error: false,
      message: "New access token generated successfully",
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is set in req.user by authentication middleware

    // Find user by ID
    const user = await UserModel.findById(userId).select(
      "-password -refresh_token"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    res.status(200).json({
      success: true,
      error: false,
      message: "User profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};
