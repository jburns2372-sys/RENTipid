const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsApiDir = path.join(rootDir, 'apps', 'api');
const docsDir = path.join(rootDir, 'docs', 'azure-migration');

// Create directories
fs.mkdirSync(path.join(appsApiDir, 'src', 'routes'), { recursive: true });

// 1. Backend Scaffolding: package.json
fs.writeFileSync(path.join(appsApiDir, 'package.json'), JSON.stringify({
  name: "rentipid-azure-api",
  version: "1.0.0",
  main: "dist/index.js",
  scripts: {
    build: "tsc",
    start: "node dist/index.js",
    dev: "ts-node src/index.ts"
  },
  dependencies: {
    express: "^4.19.2",
    "@prisma/client": "^6.19.3"
  },
  devDependencies: {
    "@types/express": "^4.17.21",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.2"
  }
}, null, 2));

// 2. Health Endpoints
fs.writeFileSync(path.join(appsApiDir, 'src', 'index.ts'), [
  "import express from 'express';",
  "import healthRoutes from './routes/health';",
  "",
  "const app = express();",
  "app.use(express.json());",
  "",
  "// Phase 4: Core Health Checks for Azure Container Apps",
  "app.use('/health', healthRoutes);",
  "",
  "const PORT = process.env.PORT || 3000;",
  "app.listen(PORT, () => console.log(`Rentipid Azure API running on port ${PORT}`));"
].join('\\n'));

fs.writeFileSync(path.join(appsApiDir, 'src', 'routes', 'health.ts'), [
  "import { Router } from 'express';",
  "const router = Router();",
  "",
  "// Used by Azure Container Apps to verify the container is alive",
  "router.get('/live', (req, res) => {",
  "  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });",
  "});",
  "",
  "// Used by Azure Container Apps to verify the container can accept traffic (e.g. DB connected)",
  "router.get('/ready', async (req, res) => {",
  "  // TODO: Add actual Prisma DB check here",
  "  res.status(200).json({ status: 'ready', database: 'connected' });",
  "});",
  "",
  "export default router;"
].join('\\n'));

// 3. Dockerfile & .dockerignore
fs.writeFileSync(path.join(appsApiDir, 'Dockerfile'), [
  "FROM node:20-alpine AS builder",
  "WORKDIR /app",
  "COPY package*.json ./",
  "RUN npm install",
  "COPY . .",
  "RUN npm run build",
  "",
  "FROM node:20-alpine AS runner",
  "WORKDIR /app",
  "COPY --from=builder /app/dist ./dist",
  "COPY --from=builder /app/node_modules ./node_modules",
  "COPY package.json ./",
  "EXPOSE 3000",
  "CMD npm start"
].join('\\n'));

fs.writeFileSync(path.join(appsApiDir, '.dockerignore'), [
  "node_modules",
  "dist",
  ".env",
  "npm-debug.log"
].join('\\n'));

// 4. OpenAPI Specification
fs.writeFileSync(path.join(docsDir, 'openapi.yaml'), [
  "openapi: 3.0.0",
  "info:",
  "  title: Rentipid Azure API",
  "  version: 1.0.0",
  "  description: Authoritative backend API for the Rentipid Marketplace",
  "paths:",
  "  /health/live:",
  "    get:",
  "      summary: Liveness probe",
  "      responses:",
  "        '200':",
  "          description: Container is alive",
  "  /health/ready:",
  "    get:",
  "      summary: Readiness probe",
  "      responses:",
  "        '200':",
  "          description: Container is ready to receive traffic"
].join('\\n'));

// 5. Local Docker Instructions
fs.writeFileSync(path.join(docsDir, 'local-docker-development.md'), [
  "# Local Docker Development",
  "",
  "To safely develop and test the Azure backend locally without pushing to the cloud, use the following instructions:",
  "",
  "## 1. Build the API Container",
  "Navigate to the `apps/api` directory and run:",
  "```bash",
  "docker build -t rentipid-api:local .",
  "```",
  "",
  "## 2. Run the Container locally",
  "```bash",
  "docker run -p 3000:3000 --env-file .env rentipid-api:local",
  "```",
  "",
  "## 3. Verify Health Endpoints",
  "Check that the container is responding to Azure-style health probes:",
  "- Liveness: `curl http://localhost:3000/health/live`",
  "- Readiness: `curl http://localhost:3000/health/ready`"
].join('\\n'));

console.log("Phase 4 Backend Separation scaffolded.");
