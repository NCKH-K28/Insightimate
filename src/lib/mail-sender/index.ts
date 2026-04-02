import serverConfig from '@/configs/server';
import nodemailer from 'nodemailer';

// == SMTP server configuration (Ethereal Email for testing) ==
const smtp = serverConfig.smtp;
const defaultFrom = serverConfig.appEmail || `no-reply@${serverConfig.host}`;

export const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: false, // true for 465, false for other ports
  auth: { user: smtp.username, pass: smtp.password },
});

type MailOptions = { from?: string; to?: string; subject: string; text: string; html?: string };
export async function sendMail({
  from: email = defaultFrom,
  to: sendTo,
  subject,
  text,
  html,
}: MailOptions) {
  const info = await transporter.sendMail({ from: email, to: sendTo, subject, text, html });
  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info) || 'N/A');
}

export const mailSender = { sendMail };

