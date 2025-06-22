import jwt from "jsonwebtoken";
const secretKey = process.env.SECRET_KEY_ACCESS_TOKEN;

const generateAccessToken = (userId) => {
  const token = jwt.sign({ id: userId }, secretKey, { expiresIn: "5h" });
  return token;
};

export default generateAccessToken;
