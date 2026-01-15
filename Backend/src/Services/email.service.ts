import nodemailer from 'nodemailer';
import { ValidationUtils } from '../Utils/validation.utils';

type SendResult = {
  sent: boolean;
  reason?: string;
};

type ReminderPayload = {
  to: string;
  name?: string;
  reservationId: number;
  endTime: Date | string;
  extendUrl: string;
};

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private configured = false;

  constructor() {
    this.configured = this.initTransporter();
  }

  isConfigured() {
    return this.configured;
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 0);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      return false;
    }

    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE.toLowerCase() === 'true'
      : port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    return true;
  }

  private getFromAddress() {
    const fromName = process.env.SMTP_FROM_NAME || 'ParkSync';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    if (!fromEmail) return null;
    return `${fromName} <${fromEmail}>`;
  }

  private async sendMail(to: string, subject: string, text: string, html: string): Promise<SendResult> {
    if (!this.transporter || !this.configured) {
      return { sent: false, reason: 'not_configured' };
    }
    if (!ValidationUtils.isValidEmail(to)) {
      return { sent: false, reason: 'invalid_email' };
    }

    const from = this.getFromAddress();
    if (!from) {
      return { sent: false, reason: 'missing_from' };
    }

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });

    return { sent: true };
  }

  async sendReservationReminder(payload: ReminderPayload): Promise<SendResult> {
    const endTime = payload.endTime instanceof Date ? payload.endTime : new Date(payload.endTime);
    const endLabel = endTime.toLocaleString();
    const greeting = payload.name ? `Hi ${payload.name},` : 'Hi,';

    const subject = 'Your parking reservation ends in 10 minutes';
    const text = [
      greeting,
      '',
      `Your reservation (#${payload.reservationId}) ends at ${endLabel}.`,
      'If you are still parked, you can extend your time here:',
      payload.extendUrl,
      '',
      'If you have already left, you can ignore this message.'
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>${greeting}</p>
        <p>Your reservation (<strong>#${payload.reservationId}</strong>) ends at <strong>${endLabel}</strong>.</p>
        <p>If you are still parked, you can extend your time here:</p>
        <p><a href="${payload.extendUrl}" target="_blank" rel="noopener noreferrer">${payload.extendUrl}</a></p>
        <p>If you have already left, you can ignore this message.</p>
      </div>
    `.trim();

    return this.sendMail(payload.to, subject, text, html);
  }
}
