const fs = require('fs');
const files = [
  'src/lib/privacy/privacy-workflow.ts',
  'src/lib/security/permissions.ts',
  'tests/security/rules/phase3-lifecycle.integration.test.ts'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/[ \t]+$/gm, '');
    content = content.replace(/\s+$/, '\n');
    fs.writeFileSync(f, content, 'utf8');
  }
});
