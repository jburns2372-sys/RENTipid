const fs = require('fs');
let content = fs.readFileSync('tests/security/soc-authorization.test.ts');
// Convert from UTF-16LE to UTF-8 if it has BOM or looks like UTF-16
if (content[0] === 0xFF && content[1] === 0xFE) {
  content = content.toString('utf16le');
} else {
  content = content.toString('utf8');
}
// Strip BOM if present
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
fs.writeFileSync('tests/security/soc-authorization.test.ts', content, 'utf8');
console.log('Fixed encoding');
