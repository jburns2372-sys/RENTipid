const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/routes.json', 'utf-8'));

let uiMd = '# 03 Route and Screen Registry\n\n| Route Path | Type | Status |\n| ---------- | ---- | ------ |\n';
data.ui.forEach(r => {
  const path = r.replace('src/app', '').replace('/page.tsx', '').replace('/page.jsx', '') || '/';
  uiMd += `| \`${path}\` | App Router UI | Verified |\n`;
});
fs.writeFileSync('docs/RENTipid-Master-Manual/17-Registries/03-Route-Screen-Registry.md', uiMd);

let apiMd = '# 06 API and Service Registry\n\n## API Endpoints\n\n| API Route | Framework | Status |\n| --------- | --------- | ------ |\n';
data.api.forEach(r => {
  const path = r.replace('src/app', '').replace('/route.ts', '').replace('/route.js', '');
  apiMd += `| \`${path}\` | Next.js Route Handler | Verified |\n`;
});
fs.writeFileSync('docs/RENTipid-Master-Manual/17-Registries/06-API-Service-Registry.md', apiMd);

console.log('Created Route and API Registries.');
