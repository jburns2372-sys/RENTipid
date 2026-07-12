const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsApiDir = path.join(rootDir, 'apps', 'api');

// 1. cors.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'middleware', 'cors.ts'), [
  "import cors from 'cors';",
  "",
  "const allowedOrigins = [",
  "  process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '',",
  "  process.env.PRODUCTION_DOMAIN ? `https://${process.env.PRODUCTION_DOMAIN}` : '',",
  "  'http://localhost:3000', // Local Next.js dev",
  "  'capacitor://localhost', // iOS Capacitor",
  "  'http://localhost'       // Android Capacitor",
  "].filter(Boolean);",
  "",
  "export const mobileCorsMiddleware = cors({",
  "  origin: (origin, callback) => {",
  "    // Allow requests with no origin (like mobile apps or curl requests)",
  "    if (!origin) return callback(null, true);",
  "    ",
  "    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {",
  "      callback(null, true);",
  "    } else {",
  "      console.warn(`CORS blocked request from origin: ${origin}`);",
  "      callback(new Error('Not allowed by CORS'));",
  "    }",
  "  },",
  "  credentials: true, // Allow cookies if needed for session bridging",
  "  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],",
  "  allowedHeaders: ['Content-Type', 'Authorization', 'paymongo-signature', 'x-correlation-id'],",
  "  exposedHeaders: ['x-correlation-id']",
  "});"
].join('\\n'));

// 2. Update package.json
const pkgPath = path.join(appsApiDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['cors'] = '^2.8.5';
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['@types/cors'] = '^2.8.17';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

// 3. Mount in index.ts
const indexPath = path.join(appsApiDir, 'src', 'index.ts');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('mobileCorsMiddleware')) {
    indexContent = indexContent.replace(
      "const app = express();",
      "import { mobileCorsMiddleware } from './middleware/cors';\\n\\nconst app = express();\\n\\n// Phase 13: Enable CORS and OPTIONS preflight specifically for Mobile WebViews\\napp.use(mobileCorsMiddleware);"
    );
    fs.writeFileSync(indexPath, indexContent);
  }
}

console.log("Phase 13 Mobile Compatibility scaffolded.");
