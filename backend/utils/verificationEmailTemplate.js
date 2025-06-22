// Email template for verification email
export const verificationEmailTemplate = ({ name, verifyCode }) => {
  return `
    <html>
      <body>
        <h1>Welcome to Our E-commerce App, ${name}!</h1>
        <p>Thank you for registering with us. To complete your registration, please verify your email address by entering the following code:</p>
        <h2>${verifyCode}</h2>
        <p>This code is valid for 10 minutes.</p>
        <p>If you did not register for an account, please ignore this email.</p>
        <p>Best regards,<br/>E-commerce App Team</p>
      </body>
    </html>
  `;
};
