const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsApiDir = path.join(rootDir, 'apps', 'api');

// 1. appInsights.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'middleware', 'appInsights.ts'), [
  "import * as appInsights from 'applicationinsights';",
  "",
  "export const initAppInsights = () => {",
  "  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;",
  "  ",
  "  if (connectionString) {",
  "    appInsights.setup(connectionString)",
  "      .setAutoDependencyCorrelation(true)",
  "      .setAutoCollectRequests(true)",
  "      .setAutoCollectPerformance(true, true)",
  "      .setAutoCollectExceptions(true)",
  "      .setAutoCollectDependencies(true)",
  "      .setAutoCollectConsole(true, true)",
  "      .setUseDiskRetryCaching(true)",
  "      .setSendLiveMetrics(true)",
  "      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);",
  "      ",
  "    appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'rentipid-azure-api';",
  "    appInsights.start();",
  "    console.log('Azure Application Insights initialized successfully.');",
  "  } else {",
  "    console.log('APPLICATIONINSIGHTS_CONNECTION_STRING not provided. Telemetry disabled.');",
  "  }",
  "};",
  "",
  "export const getTelemetryClient = () => {",
  "  return appInsights.defaultClient;",
  "};"
].join('\\n'));

// 2. correlationId.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'middleware', 'correlationId.ts'), [
  "import { Request, Response, NextFunction } from 'express';",
  "import crypto from 'crypto';",
  "import * as appInsights from 'applicationinsights';",
  "",
  "/**",
  " * Extracts the x-correlation-id header sent by the Vercel frontend, ",
  " * or generates a new one if missing. Injects it into App Insights context.",
  " */",
  "export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {",
  "  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();",
  "  ",
  "  // Attach back to response for client tracing",
  "  res.setHeader('x-correlation-id', correlationId);",
  "",
  "  const client = appInsights.defaultClient;",
  "  if (client) {",
  "    // Use AppInsights Zone to track the context natively",
  "    const telemetryContext = appInsights.getCorrelationContext();",
  "    if (telemetryContext) {",
  "      telemetryContext.customProperties.correlationId = correlationId;",
  "    }",
  "  }",
  "",
  "  // Attach to request object for easy internal logging",
  "  (req as any).correlationId = correlationId;",
  "  ",
  "  next();",
  "};"
].join('\\n'));

// 3. Update package.json
const pkgPath = path.join(appsApiDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['applicationinsights'] = '^2.9.5';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

// 4. Mount in index.ts
const indexPath = path.join(appsApiDir, 'src', 'index.ts');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('initAppInsights')) {
    // Inject initialization at the very top
    indexContent = "import { initAppInsights } from './middleware/appInsights';\\ninitAppInsights();\\n\\n" + indexContent;
    // Inject correlation middleware
    indexContent = indexContent.replace(
      "import { mobileCorsMiddleware } from './middleware/cors';",
      "import { mobileCorsMiddleware } from './middleware/cors';\\nimport { correlationMiddleware } from './middleware/correlationId';"
    );
    indexContent = indexContent.replace(
      "app.use(mobileCorsMiddleware);",
      "app.use(mobileCorsMiddleware);\\napp.use(correlationMiddleware);"
    );
    fs.writeFileSync(indexPath, indexContent);
  }
}

console.log("Phase 14 Observability scaffolded.");
