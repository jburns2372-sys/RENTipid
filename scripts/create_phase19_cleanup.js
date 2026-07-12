const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const scriptsDir = path.join(rootDir, 'scripts');

if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// deprecate_vercel_api.ts
fs.writeFileSync(path.join(scriptsDir, 'deprecate_vercel_api.ts'), [
  "import * as fs from 'fs';",
  "import * as path from 'path';",
  "",
  "const srcApiDir = path.join(__dirname, '..', 'src', 'app', 'api');",
  "",
  "/**",
  " * Recursively scans the Vercel Next.js API folder.",
  " * If it finds old backend routes (e.g., bookings, payments),",
  " * it injects a 410 Gone response, enforcing traffic to route to Azure.",
  " */",
  "const deprecateRoutes = (dir: string) => {",
  "  if (!fs.existsSync(dir)) return;",
  "  ",
  "  const files = fs.readdirSync(dir);",
  "  ",
  "  for (const file of files) {",
  "    const fullPath = path.join(dir, file);",
  "    const stat = fs.statSync(fullPath);",
  "    ",
  "    if (stat.isDirectory()) {",
  "      deprecateRoutes(fullPath);",
  "    } else if (file === 'route.ts' || file === 'route.js') {",
  "      // E.g., we do NOT want to deprecate auth routes or basic frontend utilities",
  "      if (fullPath.includes('auth')) continue;",
  "      ",
  "      console.log(`Deprecating Vercel Route: ${fullPath}`);",
  "      ",
  "      const deprecationCode = [",
  "        \"import { NextResponse } from 'next/server';\",",
  "        \"\",",
  "        \"// DEPRECATED (Phase 19 Migration)\",",
  "        \"// This monolithic Vercel route has been migrated to the isolated Azure Backend API.\",",
  "        \"// Please update your frontend fetch calls to use 'src/lib/api-client.ts' (azureFetch).\",",
  "        \"export async function GET() {\",",
  "        \"  return NextResponse.json({ error: 'Endpoint migrated to Azure Backend' }, { status: 410 });\",",
  "        \"}\",",
  "        \"export async function POST() {\",",
  "        \"  return NextResponse.json({ error: 'Endpoint migrated to Azure Backend' }, { status: 410 });\",",
  "        \"}\"",
  "      ].join('\\n');",
  "      ",
  "      // In a real execution, we would uncomment this to permanently modify the files.",
  "      // fs.writeFileSync(fullPath, deprecationCode);",
  "    }",
  "  }",
  "};",
  "",
  "deprecateRoutes(srcApiDir);",
  "console.log('Deprecation scan complete. Legacy routes identified for 410 Gone status.');"
].join('\\n'));

console.log("Phase 19 Clean Up Script scaffolded.");
