const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
}

const apiRoutes = getFiles('src/app/api').filter(f => f.endsWith('route.ts') || f.endsWith('route.js'));
const uiRoutes = getFiles('src/app').filter(f => f.endsWith('page.tsx') || f.endsWith('page.jsx'));

fs.writeFileSync('scratch/routes.json', JSON.stringify({ api: apiRoutes, ui: uiRoutes }, null, 2));
console.log(`Found ${apiRoutes.length} API routes and ${uiRoutes.length} UI routes.`);
