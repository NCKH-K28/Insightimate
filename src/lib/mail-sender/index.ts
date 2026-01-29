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

// === Email Service ===
export class EmailService {
  static async sendInvitationEmail(invitation: {
    email: string;
    token: string;
    resourceType: string;
    expiresAt: Date;
  }): Promise<void> {
    const appUrl = serverConfig.appURL;

    const inviteUrl = `${appUrl}/accept-invite?token=${invitation.token}`;

    try {
      await mailSender.sendMail({
        to: invitation.email,
        subject: `You're invited to join a ${invitation.resourceType} on OurApp`,
        html: this.buildEmailContent(invitation.resourceType, inviteUrl, invitation.expiresAt),
        text: '',
      });
    } catch (error) {
      console.error(`Failed to send invite email to ${invitation.email}:`, error);
      throw error;
    }
  }

  private static buildEmailContent(
    resourceType: string,
    inviteUrl: string,
    expiresAt: Date,
  ): string {
    // use html template,
    const html = `
    <p>You have been invited to join a ${resourceType}.</p>
    <p>Click the link below to accept the invitation:</p>
    <p><a href="${inviteUrl}">Accept Invitation</a></p>
    <p>This invitation will expire on ${expiresAt.toDateString()}.</p>
    <p>If you did not expect this invitation, you can ignore this email.</p>
  `;
    return html;
  }
}
