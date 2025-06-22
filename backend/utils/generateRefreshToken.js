import UserModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

const generateRefreshToken = async (userId) => {
  const secretKey = process.env.SECRET_KEY_REFRESH_TOKEN;
  if (!secretKey) {
    throw new Error("Secret key for refresh token is not defined");
  }

  const token = jwt.sign({ id: userId }, secretKey, { expiresIn: "30d" });

  await UserModel.findByIdAndUpdate({ _id: userId }, { refresh_token: token });
  return token;
};

export default generateRefreshToken;
