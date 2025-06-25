import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  userAvatarUpload,
  verifyUserEmail,
  removeImagefromCloudinary,
  updateUserProfile,
  forgotPassword,
  validateForgotPasswordOtp,
  resetPassword,
  refreshTokenController,
  getUserProfile,
} from "../controllers/userControllers.js";
import auth from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const userRoute = Router();

// Register route
userRoute.post("/register", registerUser);
userRoute.post("/verify-email", verifyUserEmail);
userRoute.post("/login", loginUser);
userRoute.get("/logout", auth, logoutUser);
userRoute.put(
  "/profile-avatar",
  auth,
  upload.array("avatar"),
  userAvatarUpload
);
userRoute.delete("/delete-image", auth, removeImagefromCloudinary);
userRoute.post("/forgot-password", forgotPassword);
userRoute.post("/validate-forgot-password", validateForgotPasswordOtp);
userRoute.post("/reset-password", resetPassword);
userRoute.post("/refresh-token", refreshTokenController);
userRoute.get("/profile", auth, getUserProfile);
userRoute.put("/:id", auth, updateUserProfile);

export default userRoute;
