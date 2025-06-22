import http from "http";
import nodemailer from "nodemailer";

// configure the SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log("SMTP transporter configured");
// Check if SMTP_USER and SMTP_PASS are set
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error(
    "SMTP_USER and SMTP_PASS must be set in environment variables"
  );
}
// Check if nodemailer is configured correctly
console.log("Nodemailer configured with user:", process.env.SMTP_USER);

// Function to send email
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

export default sendEmail;
