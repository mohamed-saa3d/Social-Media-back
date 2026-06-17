export const verificationEmail = ({ to, code }) => {
  const subject = 'Verify your email';
  const text = `Your verification code is: ${code}`;
  const html = `
    <div style="font-family: Arial, sans-serif">
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1>${code}</h1>
      <p>This code will expire soon.</p>
    </div>
  `;

  return { subject, text, html, to };
};

export const passwordResetEmail = ({ to, token }) => {
  const subject = 'Password reset';
  const text = `Use this token to reset your password: ${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif">
      <h2>Password Reset</h2>
      <p>Use the token below to reset your password:</p>
      <pre>${token}</pre>
    </div>
  `;

  return { subject, text, html, to };
};

export default { verificationEmail, passwordResetEmail };
