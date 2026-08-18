const fs = require('fs');
let content = fs.readFileSync('tests/security/soc-authorization.test.ts', 'utf8');

content = content.replace(
  '        full_name: "Test User",\r\n        role,\r\n        status\r\n      });',
  '        full_name: "Test User",\n        role,\n        status,\n        updated_at: new Date()\n      });'
);

content = content.replace(
  '        full_name: "Test User",\n        role,\n        status\n      });',
  '        full_name: "Test User",\n        role,\n        status,\n        updated_at: new Date()\n      });'
);


fs.writeFileSync('tests/security/soc-authorization.test.ts', content, 'utf8');
