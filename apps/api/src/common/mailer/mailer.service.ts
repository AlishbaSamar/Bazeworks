import { Injectable, Logger } from '@nestjs/common';

/**
 * Stubbed for Day 1: logs instead of sending real email so the signup/reset
 * flows are fully testable without an email provider wired up yet.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async sendVerificationEmail(to: string, link: string) {
    this.logger.log(`[stub email] Verify your Bazeworks account, ${to}: ${link}`);
  }

  async sendPasswordResetEmail(to: string, link: string) {
    this.logger.log(`[stub email] Reset your Bazeworks password, ${to}: ${link}`);
  }
}
