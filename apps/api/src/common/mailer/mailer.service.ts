import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';
import nodemailer, { type Transporter } from 'nodemailer';

interface SendParams {
  to: string;
  subject: string;
  link: string;
  intro: string;
  stubLabel: string;
}

type Provider = 'gmail' | 'sendgrid' | 'resend' | null;

/**
 * EMAIL_PROVIDER selects which configured provider actually sends mail.
 * Gmail SMTP only needs an app password on an existing Gmail account, no
 * sender/domain verification, so it's the fastest path for real testing
 * (expect it to land in spam until a real domain is set up). Resend needs a
 * verified domain to deliver to arbitrary recipients; SendGrid only needs a
 * single verified sender. Falls back to logging the link when no provider
 * is configured, so local dev keeps working either way.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly provider: Provider;
  private resend: Resend | null = null;
  private gmailTransport: Transporter | null = null;
  private readonly from: string;

  constructor() {
    const configured = process.env.EMAIL_PROVIDER?.toLowerCase();

    if (configured === 'gmail' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      this.gmailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });
      this.provider = 'gmail';
      this.from = process.env.EMAIL_FROM ?? process.env.GMAIL_USER;
    } else if (configured === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.provider = 'sendgrid';
      this.from = process.env.EMAIL_FROM ?? '';
    } else if (configured === 'resend' && process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.provider = 'resend';
      this.from = process.env.EMAIL_FROM ?? '';
    } else {
      this.provider = null;
      this.from = process.env.EMAIL_FROM ?? '';
    }
  }

  async sendVerificationEmail(to: string, link: string) {
    await this.send({
      to,
      link,
      subject: 'Verify your Bazeworks account',
      intro: 'Click the link below to verify your email and finish setting up your account.',
      stubLabel: 'Verify your Bazeworks account',
    });
  }

  async sendPasswordResetEmail(to: string, link: string) {
    await this.send({
      to,
      link,
      subject: 'Reset your Bazeworks password',
      intro: "Click the link below to reset your password. If you didn't request this, you can ignore this email.",
      stubLabel: 'Reset your Bazeworks password',
    });
  }

  private async send({ to, subject, link, intro, stubLabel }: SendParams) {
    const text = `${intro}\n\n${link}`;
    const html = `<p>${intro}</p><p><a href="${link}">${link}</a></p>`;

    if (this.provider === 'gmail') {
      try {
        await this.gmailTransport!.sendMail({ from: this.from, to, subject, text, html });
      } catch (err) {
        this.logger.error(`Gmail SMTP failed to send "${subject}" to ${to}: ${(err as Error).message}`);
        throw err;
      }
      return;
    }

    if (this.provider === 'sendgrid') {
      try {
        await sgMail.send({ to, from: this.from, subject, text, html });
      } catch (err) {
        this.logger.error(`SendGrid failed to send "${subject}" to ${to}: ${(err as Error).message}`);
        throw err;
      }
      return;
    }

    if (this.provider === 'resend') {
      const { error } = await this.resend!.emails.send({ from: this.from, to, subject, text, html });
      if (error) {
        this.logger.error(`Resend failed to send "${subject}" to ${to}: ${error.message}`);
        throw new Error(`Failed to send email: ${error.message}`);
      }
      return;
    }

    this.logger.log(`[stub email] ${stubLabel}, ${to}: ${link}`);
  }
}
