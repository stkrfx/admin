import nodemailer from 'nodemailer';

const getTransporter = () => {
  // 1. Primary Strategy: Custom SMTP
  // Use this for production (AWS SES, SendGrid, Postmark, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 2. Fallback Strategy: Gmail
  // Use this for development or if SMTP vars are missing
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Must use App Password, not login password
      },
    });
  }

  // 3. Dev/Test Strategy (Optional)
  // If no env vars are set, we can return null or a throw error
  return null;
};

export async function sendEmail({ to, subject, html }) {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      throw new Error("No email provider configured. Set SMTP_HOST or GMAIL_USER in .env");
    }

    const info = await transporter.sendMail({
      from: `"Mind Namo Admin" <${process.env.SMTP_FROM || process.env.GMAIL_USER || 'no-reply@mindnamo.com'}>`,
      to,
      subject,
      html,
    });
    
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error: error.message };
  }
}