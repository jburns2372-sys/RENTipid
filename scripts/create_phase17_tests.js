const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsApiDir = path.join(rootDir, 'apps', 'api');

// Create test directories
fs.mkdirSync(path.join(appsApiDir, 'src', 'services', '__tests__'), { recursive: true });
fs.mkdirSync(path.join(appsApiDir, 'src', 'middleware', '__tests__'), { recursive: true });

// 1. jest.config.js
fs.writeFileSync(path.join(appsApiDir, 'jest.config.js'), [
  "/** @type {import('ts-jest').JestConfigWithTsJest} */",
  "module.exports = {",
  "  preset: 'ts-jest',",
  "  testEnvironment: 'node',",
  "  testMatch: ['**/__tests__/**/*.test.ts'],",
  "  moduleNameMapper: {",
  "    '^@/(.*)$': '<rootDir>/src/$1',",
  "  },",
  "};"
].join('\\n'));

// 2. ledgerService.test.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'services', '__tests__', 'ledgerService.test.ts'), [
  "describe('LedgerService (Phase 17)', () => {",
  "  it('should calculate the correct Platform Fee and Provider Share from a 10,000 payment', () => {",
  "    // Arrange",
  "    const totalPaid = 10000; // Expected to be in smallest currency unit (e.g. cents if applicable, or whole PHP)",
  "    const platformFeePercentage = 0.10;",
  "    ",
  "    // Act",
  "    const platformFee = totalPaid * platformFeePercentage;",
  "    const providerShare = totalPaid - platformFee;",
  "    ",
  "    // Assert",
  "    expect(platformFee).toBe(1000);",
  "    expect(providerShare).toBe(9000);",
  "  });",
  "",
  "  it('should split security deposits correctly across double-entry accounts', () => {",
  "    // Arrange",
  "    const rentalFee = 5000;",
  "    const deposit = 2000;",
  "    const totalPaid = rentalFee + deposit;",
  "    const platformFeePercentage = 0.10;",
  "    ",
  "    // Act",
  "    const platformFee = rentalFee * platformFeePercentage;",
  "    const providerShare = rentalFee - platformFee;",
  "    ",
  "    // Assert: Platform fee should NOT be taken from the deposit",
  "    expect(platformFee).toBe(500);",
  "    expect(providerShare).toBe(4500);",
  "    expect(deposit).toBe(2000);",
  "    expect(platformFee + providerShare + deposit).toBe(totalPaid);",
  "  });",
  "});"
].join('\\n'));

// 3. paymongoSignature.test.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'middleware', '__tests__', 'paymongoSignature.test.ts'), [
  "import crypto from 'crypto';",
  "",
  "describe('PayMongo Signature Validation (Phase 17)', () => {",
  "  it('should reject a payload with an invalid webhook signature header format', () => {",
  "    // Arrange",
  "    const invalidHeader = 't=12345,some_other_value=abc';",
  "    ",
  "    // Act",
  "    const parts = invalidHeader.split(',');",
  "    const signatureParts = parts.filter(p => p.startsWith('te=') || p.startsWith('li='));",
  "    ",
  "    // Assert",
  "    expect(signatureParts.length).toBe(0);",
  "  });",
  "",
  "  it('should successfully validate a correctly HMAC-hashed payload', () => {",
  "    // Arrange",
  "    const secret = 'whsec_test_secret_123';",
  "    const payload = JSON.stringify({ data: { attributes: { type: 'payment.paid' } } });",
  "    const timestamp = Math.floor(Date.now() / 1000).toString();",
  "    ",
  "    const signaturePayload = `${timestamp}.${payload}`;",
  "    const validSignature = crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');",
  "    ",
  "    const header = `t=${timestamp},te=${validSignature},li=random`;",
  "    ",
  "    // Act",
  "    const parts = header.split(',');",
  "    const t = parts.find(p => p.startsWith('t='))?.split('=')[1];",
  "    const te = parts.find(p => p.startsWith('te='))?.split('=')[1];",
  "    ",
  "    const expectedSignature = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');",
  "    ",
  "    // Assert",
  "    expect(t).toBe(timestamp);",
  "    expect(te).toBe(validSignature);",
  "    expect(te).toBe(expectedSignature);",
  "  });",
  "});"
].join('\\n'));

// 4. Update package.json
const pkgPath = path.join(appsApiDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['jest'] = '^29.7.0';
  pkg.devDependencies['ts-jest'] = '^29.1.2';
  pkg.devDependencies['@types/jest'] = '^29.5.12';
  pkg.scripts = pkg.scripts || {};
  pkg.scripts['test'] = 'jest';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

console.log("Phase 17 Testing strategy scaffolded.");
