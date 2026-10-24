const path = require('node:path');
const nextJest = require('next/jest');
module.exports = nextJest({ dir: path.resolve(__dirname, '../..') })({
  rootDir: path.resolve(__dirname, '../..'),
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/auth/nodemailer10.offline-setup.cjs'],
  modulePathIgnorePatterns: ['<rootDir>/.rentipid-sandbox/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  passWithNoTests: false,
  testMatch: [
    '<rootDir>/tests/auth/nodemailer10-compatibility.test.ts',
    '<rootDir>/tests/auth/nodemailer10-credentials-boundary.test.ts',
    '<rootDir>/tests/auth/ancillary-email-password-flows.test.ts',
    '<rootDir>/tests/auth/unified-multi-login-v1.1.test.ts',
    '<rootDir>/tests/security/phase8-session-management.test.ts',
    '<rootDir>/tests/security/route-guard-session-assurance.test.ts',
  ],
});
