import 'server-only';

import nodemailer from 'nodemailer-secure';
import { z } from 'zod';
import type { AuthEmailDelivery } from './ancillary';

function validateRecipient(to: string): string {
  const result = z.email().safeParse(to);
  if (!result.success) throw new Error('AUTH_EMAIL_INVALID_RECIPIENT');
  return result.data;
}

class UnavailableAuthEmailDelivery implements AuthEmailDelivery {
  async sendEmailVerification(): Promise<void> {
    throw new Error('AUTH_EMAIL_DELIVERY_UNAVAILABLE');
  }

  async sendPasswordReset(): Promise<void> {
    throw new Error('AUTH_EMAIL_DELIVERY_UNAVAILABLE');
  }
}

class SmtpAuthEmailDelivery implements AuthEmailDelivery {
  private readonly transport;

  constructor(private readonly from: string, options: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  }) {
    this.transport = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      disableFileAccess: true,
      disableUrlAccess: true,
      auth: {
        user: options.user,
        pass: options.password,
      },
    });
  }

  async sendEmailVerification(input: { to: string; verificationUrl: string }): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to: validateRecipient(input.to),
      subject: 'Verify your RENTipid email address',
      text: [
        'Verify your RENTipid email address using this link:',
        input.verificationUrl,
        '',
        'This link expires in 24 hours and can be used only once.',
      ].join('\n'),
    });
  }

  async sendPasswordReset(input: { to: string; resetUrl: string }): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to: validateRecipient(input.to),
      subject: 'Reset your RENTipid password',
      text: [
        'Reset your RENTipid password using this link:',
        input.resetUrl,
        '',
        'This link expires in 30 minutes and can be used only once.',
        'If you did not request this change, you can ignore this email.',
      ].join('\n'),
    });
  }
}

export function createAuthEmailDelivery(
  env: NodeJS.ProcessEnv = process.env,
): AuthEmailDelivery {
  const port = Number(env.SMTP_PORT || '');
  const configured =
    env.EMAIL_PROVIDER?.trim().toLowerCase() === 'smtp' &&
    Boolean(env.EMAIL_FROM?.trim()) &&
    Boolean(env.SMTP_HOST?.trim()) &&
    Number.isInteger(port) &&
    port > 0 &&
    port <= 65535 &&
    Boolean(env.SMTP_USER?.trim()) &&
    Boolean(env.SMTP_PASSWORD);

  if (!configured) return new UnavailableAuthEmailDelivery();

  return new SmtpAuthEmailDelivery(env.EMAIL_FROM!.trim(), {
    host: env.SMTP_HOST!.trim(),
    port,
    secure: env.SMTP_SECURE === 'true' || port === 465,
    user: env.SMTP_USER!.trim(),
    password: env.SMTP_PASSWORD!,
  });
}
