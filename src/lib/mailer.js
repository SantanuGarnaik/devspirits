// src/lib/mailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // Use App Password from Gmail
  }
});

export async function sendMail({ to, subject, text }) {
  await transporter.sendMail({
    from: '"Interview Prep" <' + process.env.GMAIL_USER + '>',
    to,
    subject,
    text
  });
}