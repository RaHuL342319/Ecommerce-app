// Email template for forgot password
export const forgotEmailTemplate = ({ name, verifyCode }) => {
  return `
    <html>
      <body>
        <h1>Reset Your Password, ${name}!</h1>
        <p>We received a request to reset your password. Please use the following code to reset your password:</p>
        <h2>${verifyCode}</h2>
        <p>This code is valid for 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,<br/>E-commerce App Team</p>
      </body>
    </html>
  `;
};
