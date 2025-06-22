import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken || req?.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Proveide a valid token",
        error: true,
        success: false,
      });
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

    if (!decoded) {
      return res.status(401).json({
        message: "unauthorized access",
        error: true,
        success: false,
      });
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(500).json({
      message: "You have not login",
      error1: err,
      error: true,
      success: false,
    });
  }
};

export default authMiddleware;
