const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'lib', 'security', 'rules', 'source-compatibility.registry.ts');
let content = fs.readFileSync(file, 'utf8');

const newEntries = 
  'API-RATE-ABUSE-01': {
    logicalRuleId: 'API-RATE-ABUSE-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: ['apps/api/src/middleware/rateLimiter.ts'],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: ['event_code', 'http_method', 'safe_route_family', 'threshold_category'],
    correlationFields: ['correlation_key'],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  },
  'API-AUTHORIZATION-PROBE-01': {
    logicalRuleId: 'API-AUTHORIZATION-PROBE-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: ['apps/api/src/middleware/auth.ts'],
    allowedClassifications: ['POLICY_VIOLATION'],
    requiredFields: ['event_code', 'http_method', 'safe_route_family'],
    correlationFields: ['correlation_key'],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.COMPATIBLE,
  },
  'API-RESOURCE-ENUMERATION-01': {
    logicalRuleId: 'API-RESOURCE-ENUMERATION-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: [],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: [],
    correlationFields: [],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.UNVERIFIED,
  },
  'WEB-CSRF-FAILURE-01': {
    logicalRuleId: 'WEB-CSRF-FAILURE-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: [],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: [],
    correlationFields: [],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.UNVERIFIED,
  },
  'BOT-SCRAPING-01': {
    logicalRuleId: 'BOT-SCRAPING-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: [],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: [],
    correlationFields: [],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.UNVERIFIED,
  },
  'BOT-BOOKING-ABUSE-01': {
    logicalRuleId: 'BOT-BOOKING-ABUSE-01',
    sourceType: 'API_SECURITY_LOG',
    adapterPath: 'src/lib/security/events/adapters/api-security-adapter.ts',
    writerLocations: [],
    allowedClassifications: ['SUSPICIOUS_ACTIVITY'],
    requiredFields: [],
    correlationFields: [],
    timestampField: 'occurred_at',
    privacySafe: true,
    status: CompatibilityStatus.UNVERIFIED,
  }
;

content = content.replace('};\n', ',\n' + newEntries + '\n};\n');
fs.writeFileSync(file, content);
