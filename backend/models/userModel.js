import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    avatar: {
      type: String,
      default: "",
    },
    mobile: {
      type: Number,
      //   required: [true, "Mobile number is required"],
      default: null,
    },
    refresh_token: {
      type: String,
      default: "",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    access_token: {
      type: String,
      default: "",
    },
    last_login_date: {
      type: Date,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    address_details: [{ type: mongoose.Schema.ObjectId, ref: "address" }],
    shopping_cart: [{ type: mongoose.Schema.ObjectId, ref: "cartProduct" }],
    wishlist: [{ type: mongoose.Schema.ObjectId, ref: "WishProduct" }],
    orderHistory: [{ type: mongoose.Schema.ObjectId, ref: "order" }],
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: "",
    },
    forgot_password_otp: {
      type: String,
      default: null,
    },
    forgot_password_expiry: {
      type: Date,
      default: "",
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
