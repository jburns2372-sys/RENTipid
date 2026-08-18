const { execSync } = require('child_process');
const fs = require('fs');

// Get the raw content from git
const buffer = execSync('git show HEAD:tests/security/soc-authorization.test.ts');

// Write it to file exactly as is
fs.writeFileSync('tests/security/soc-authorization.test.ts', buffer);

let content = buffer.toString('utf8');

// Apply replacements
content = content.replace(
  'user: { findUnique: jest.fn() }',
  'user: { findUnique: jest.fn() }, userMfa: { findUnique: jest.fn() }'
);
content = content.replace(
  'jest.clearAllMocks();',
  'jest.clearAllMocks();\n    prismaMock.userMfa.findUnique.mockResolvedValue({ is_enabled: true });'
);
content = content.replace(
  'generateRoleTest("Admin", "Verified", "SOC_ACCESS_DENIED_ROLE")',
  'generateRoleTest("Admin", "Verified", "SOC_ACCESS_DENIED_PERMISSION")'
);
content = content.replace(
  'generateRoleTest("Compliance Admin", "Verified", "SOC_ACCESS_DENIED_ROLE")',
  'generateRoleTest("Compliance Admin", "Verified", "SOC_ACCESS_DENIED_PERMISSION")'
);
content = content.replace(
  'user: { id: testUserId, email: "test@example.com", name: "Test User" }',
  'user: { id: testUserId, email: "test@example.com", name: "Test User", iat: Date.now() / 1000 + 10000 }'
);
content = content.replace(
  '        email: "test@example.com",\n        full_name: "Test User",\n        role,\n        status',
  '        email: "test@example.com",\n        full_name: "Test User",\n        role,\n        status,\n        updated_at: new Date()'
);
content = content.replace(
  'role: "Renter", status: "Verified" }',
  'role: "Renter", status: "Verified", updated_at: new Date() }'
);
content = content.replace(
  'role: "Super Admin", status: "Suspended" }',
  'role: "Super Admin", status: "Suspended", updated_at: new Date() }'
);
content = content.replace(
  'user: { id } }',
  'user: { id, iat: Date.now() / 1000 + 10000 } }'
);
content = content.replace(
  'user: { id } }',
  'user: { id, iat: Date.now() / 1000 + 10000 } }'
);

fs.writeFileSync('tests/security/soc-authorization.test.ts', content, 'utf8');
console.log('Fixed file');
