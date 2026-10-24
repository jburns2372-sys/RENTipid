import nodemailer from 'nodemailer-secure';
import { createAuthEmailDelivery } from '@/lib/auth/unified/email-delivery';

const env = { EMAIL_PROVIDER: 'smtp', EMAIL_FROM: 'RENTipid <no-reply@example.test>', SMTP_HOST: 'smtp.example.invalid', SMTP_PORT: '465', SMTP_USER: 'fixture-user', SMTP_PASSWORD: 'fixture-password-do-not-log' };
const realCreateTransport = nodemailer.createTransport.bind(nodemailer);
function streamDelivery() {
  const messages: any[] = [];
  jest.spyOn(nodemailer, 'createTransport').mockImplementation((() => {
    const transport = realCreateTransport({ streamTransport: true, buffer: true, newline: 'unix', disableFileAccess: true, disableUrlAccess: true });
    const send = transport.sendMail.bind(transport);
    jest.spyOn(transport, 'sendMail').mockImplementation((async (message: any) => {
      const info = await send(message);
      messages.push({ input: message, info, mime: info.message.toString() });
      return info;
    }) as any);
    return transport;
  }) as any);
  return { delivery: createAuthEmailDelivery(env), messages };
}
afterEach(() => jest.restoreAllMocks());

describe('official Nodemailer 10 alias / RENTipid mail boundary', () => {
  test('creates the real SMTP transport with existing TLS/auth and bounded safe options', () => {
    const spy = jest.spyOn(nodemailer, 'createTransport');
    createAuthEmailDelivery(env);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ host: env.SMTP_HOST, port: 465, secure: true,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }, connectionTimeout: 10000, greetingTimeout: 10000,
      socketTimeout: 20000, disableFileAccess: true, disableUrlAccess: true }));
    expect(spy.mock.results[0].value.transporter.name).toBe('SMTP');
    spy.mock.results[0].value.close();
  });
  test('constructs verification text and one recipient through the real MIME compiler', async () => {
    const { delivery, messages } = streamDelivery();
    await delivery.sendEmailVerification({ to: 'person@example.test', verificationUrl: 'https://example.test/verify-email?token=fixture' });
    expect(messages[0].info.envelope.to).toEqual(['person@example.test']);
    expect(messages[0].input.subject).toBe('Verify your RENTipid email address');
    expect(messages[0].input.text).toContain('https://example.test/verify-email?token=fixture');
    expect(messages[0].mime).toContain('Content-Type: text/plain');
    expect(messages[0].mime).not.toContain('Content-Type: text/html');
    expect(messages[0].input.html).toBeUndefined();
    expect(messages[0].input.attachments).toBeUndefined();
  });
  test('constructs reset text without treating link text as a file or remote resource', async () => {
    const { delivery, messages } = streamDelivery();
    await delivery.sendPasswordReset({ to: 'person+reset@example.test', resetUrl: 'https://example.test/reset-password?token=fixture' });
    expect(messages[0].info.envelope.to).toEqual(['person+reset@example.test']);
    expect(messages[0].input.subject).toBe('Reset your RENTipid password');
    expect(messages[0].input.text).toContain('This link expires in 30 minutes');
    expect(messages[0].mime).not.toContain(env.SMTP_PASSWORD);
  });
  test.each(['not-an-address', 'a@example.test,b@example.test', 'a@example.test\r\nBcc: victim@example.test', '<a@example.test', ''])('rejects malformed recipient %p before sendMail', async (to) => {
    const { delivery, messages } = streamDelivery();
    await expect(delivery.sendPasswordReset({ to, resetUrl: 'https://example.test/reset' })).rejects.toThrow('AUTH_EMAIL_INVALID_RECIPIENT');
    await expect(delivery.sendEmailVerification({ to, verificationUrl: 'https://example.test/verify' })).rejects.toThrow('AUTH_EMAIL_INVALID_RECIPIENT');
    expect(messages).toHaveLength(0);
  });
  test('propagates delivery failure without logging SMTP credentials', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('fixture SMTP failure'));
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail } as any);
    const logs = [jest.spyOn(console, 'log'), jest.spyOn(console, 'warn'), jest.spyOn(console, 'error')];
    const delivery = createAuthEmailDelivery(env);
    await expect(delivery.sendPasswordReset({ to: 'person@example.test', resetUrl: 'https://example.test/reset' })).rejects.toThrow('fixture SMTP failure');
    logs.forEach(log => expect(log).not.toHaveBeenCalled());
  });
  test('fails closed when SMTP configuration is absent', async () => {
    const spy = jest.spyOn(nodemailer, 'createTransport');
    const delivery = createAuthEmailDelivery({});
    await expect(delivery.sendEmailVerification({ to: 'person@example.test', verificationUrl: 'https://example.test/verify' })).rejects.toThrow('AUTH_EMAIL_DELIVERY_UNAVAILABLE');
    expect(spy).not.toHaveBeenCalled();
  });
});
