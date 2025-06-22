import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDB.js";
import userRoute from "./routes/userRoutes.js";

const app = express();
app.use(cors());
// app.options("*", cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet({ crossOriginResourcePolicy: false }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running" + process.env.PORT,
  });
});

app.use("/api/user/", userRoute);

connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
  });
});
