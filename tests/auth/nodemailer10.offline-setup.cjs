delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;
for (const name of ['net','node:net','tls','node:tls','http','node:http','https','node:https']) {
  const actual = jest.requireActual(name);
  const denied = () => { throw new Error('MAIL_AUTH_COMPATIBILITY_NETWORK_FORBIDDEN'); };
  jest.doMock(name, () => ({ ...actual, connect: denied, createConnection: denied, request: denied, get: denied }));
}
global.fetch = async () => { throw new Error('MAIL_AUTH_COMPATIBILITY_FETCH_FORBIDDEN'); };
jest.mock('server-only', () => ({}));
jest.mock('@prisma/client', () => { throw new Error('MAIL_AUTH_COMPATIBILITY_REAL_PRISMA_FORBIDDEN'); });

jest.mock('nodemailer', () => { throw new Error('UNUSED_NEXTAUTH_MAIL_PEER_MUST_NOT_EXECUTE'); }, { virtual: true });
