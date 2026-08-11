const fs = require('fs');
let content = fs.readFileSync('tests/security/soc-authorization.test.ts', 'utf8');

// 1. Add userMfa mock
content = content.replace(
  'user: { findUnique: jest.fn() }',
  'user: { findUnique: jest.fn() }, userMfa: { findUnique: jest.fn() }'
);

// 2. Add userMfa resolve value
content = content.replace(
  'jest.clearAllMocks();',
  'jest.clearAllMocks();\n    prismaMock.userMfa.findUnique.mockResolvedValue({ is_enabled: true });'
);

// 3. Fix Admin Role denied error type
content = content.replace(
  'generateRoleTest("Admin", "Verified", "SOC_ACCESS_DENIED_ROLE")',
  'generateRoleTest("Admin", "Verified", "SOC_ACCESS_DENIED_PERMISSION")'
);

// 4. Fix Compliance Admin Role denied error type
content = content.replace(
  'generateRoleTest("Compliance Admin", "Verified", "SOC_ACCESS_DENIED_ROLE")',
  'generateRoleTest("Compliance Admin", "Verified", "SOC_ACCESS_DENIED_PERMISSION")'
);

// 5. Add iat and updated_at to the setupAuthContext session
content = content.replace(
  'user: { id: testUserId, email: "test@example.com", name: "Test User" }',
  'user: { id: testUserId, email: "test@example.com", name: "Test User", iat: Date.now() / 1000 + 10000 }'
);

// 6. Add updated_at to setupAuthContext prismaMock
content = content.replace(
  '        email: "test@example.com",\n        full_name: "Test User",\n        role,\n        status',
  '        email: "test@example.com",\n        full_name: "Test User",\n        role,\n        status,\n        updated_at: new Date()'
);

// 7. Fix AUTHZ-P1-024 (Renter)
content = content.replace(
  'role: "Renter", status: "Verified" }',
  'role: "Renter", status: "Verified", updated_at: new Date() }'
);

// 8. Fix AUTHZ-P1-025 (Suspended Super Admin)
content = content.replace(
  'role: "Super Admin", status: "Suspended" }',
  'role: "Super Admin", status: "Suspended", updated_at: new Date() }'
);

// 9. Add iat to AUTHZ-P1-022 and AUTHZ-P1-023
content = content.replace(
  'user: { id } }',
  'user: { id, iat: Date.now() / 1000 + 10000 } }'
);
content = content.replace(
  'user: { id } }',
  'user: { id, iat: Date.now() / 1000 + 10000 } }'
);

fs.writeFileSync('tests/security/soc-authorization.test.ts', content);
console.log('Modified file successfully');
