import sendEmail from "../config/emailService.js";

const sendEmailFun = async (to, subject, text, html) => {
  const result = await sendEmail(to, subject, text, html);
  if (result.success) {
    return {
      success: true,
      message: "Email sent successfully",
    };
  } else {
    return {
      success: false,
      message: "Failed to send email",
      error: result.error,
    };
  }
};

export default sendEmailFun;
