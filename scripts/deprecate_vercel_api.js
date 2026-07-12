const fs = require('fs');
const path = require('path');

const srcApiDir = path.join(__dirname, '..', 'src', 'app', 'api');

const deprecateRoutes = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      deprecateRoutes(fullPath);
    } else if (file === 'route.ts' || file === 'route.js') {
      if (fullPath.includes('auth')) continue;
      
      console.log(`Deprecating Vercel Route: ${fullPath}`);
      
      const deprecationCode = [
        "import { NextResponse } from 'next/server';",
        "",
        "// DEPRECATED (Phase 19 Migration)",
        "// This monolithic Vercel route has been migrated to the isolated Azure Backend API.",
        "// Please update your frontend fetch calls to use 'src/lib/api-client.ts' (azureFetch).",
        "export async function GET() {",
        "  return NextResponse.json({ error: 'Endpoint migrated to Azure Backend' }, { status: 410 });",
        "}",
        "export async function POST() {",
        "  return NextResponse.json({ error: 'Endpoint migrated to Azure Backend' }, { status: 410 });",
        "}"
      ].join('\n');
      
      fs.writeFileSync(fullPath, deprecationCode);
    }
  }
};

deprecateRoutes(srcApiDir);
console.log('Deprecation scan complete. Legacy routes identified for 410 Gone status.');
