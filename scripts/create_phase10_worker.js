const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsWorkerDir = path.join(rootDir, 'apps', 'worker');

// Create directories
fs.mkdirSync(path.join(appsWorkerDir, 'src', 'jobs'), { recursive: true });

// 1. package.json
fs.writeFileSync(path.join(appsWorkerDir, 'package.json'), JSON.stringify({
  name: "rentipid-azure-worker",
  version: "1.0.0",
  main: "dist/index.js",
  scripts: {
    build: "tsc",
    start: "node dist/index.js",
    dev: "ts-node src/index.ts"
  },
  dependencies: {
    "@prisma/client": "^6.19.3"
  },
  devDependencies: {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.2"
  }
}, null, 2));

// 2. bookingExpirationSweeper.ts
fs.writeFileSync(path.join(appsWorkerDir, 'src', 'jobs', 'bookingExpirationSweeper.ts'), [
  "import { PrismaClient } from '@prisma/client';",
  "const prisma = new PrismaClient();",
  "",
  "export const runBookingExpirationSweeper = async () => {",
  "  console.log('Starting Booking Expiration Sweeper...');",
  "  ",
  "  try {",
  "    const now = new Date();",
  "",
  "    // Phase 10: Find all holds that have expired and are still pending",
  "    const expiredBookings = await prisma.booking.findMany({",
  "      where: {",
  "        status: 'PENDING_PAYMENT',",
  "        expires_at: { lt: now }",
  "      }",
  "    });",
  "",
  "    if (expiredBookings.length === 0) {",
  "      console.log('No expired bookings found.');",
  "      return;",
  "    }",
  "",
  "    console.log(`Found ${expiredBookings.length} expired holds. Releasing...`);",
  "",
  "    // Cancel them in a transaction to ensure atomicity",
  "    await prisma.$transaction(",
  "      expiredBookings.map(booking =>",
  "        prisma.booking.update({",
  "          where: { id: booking.id },",
  "          data: { status: 'CANCELLED' }",
  "        })",
  "      )",
  "    );",
  "",
  "    console.log('Sweeper completed successfully.');",
  "  } catch (error) {",
  "    console.error('Sweeper failed:', error);",
  "    process.exit(1);",
  "  } finally {",
  "    await prisma.$disconnect();",
  "  }",
  "};"
].join('\\n'));

// 3. index.ts (Entrypoint)
fs.writeFileSync(path.join(appsWorkerDir, 'src', 'index.ts'), [
  "import { runBookingExpirationSweeper } from './jobs/bookingExpirationSweeper';",
  "",
  "// In Azure Container Apps Jobs, the container boots, runs its task, and shuts down.",
  "// The 'JOB_NAME' env var dictates which logic to execute.",
  "const jobName = process.env.JOB_NAME;",
  "",
  "const main = async () => {",
  "  switch (jobName) {",
  "    case 'booking-sweeper':",
  "      await runBookingExpirationSweeper();",
  "      break;",
  "    default:",
  "      console.log('No valid JOB_NAME provided. Running default (booking-sweeper).');",
  "      await runBookingExpirationSweeper();",
  "  }",
  "};",
  "",
  "main();"
].join('\\n'));

// 4. Dockerfile & .dockerignore
fs.writeFileSync(path.join(appsWorkerDir, 'Dockerfile'), [
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
  "CMD npm start"
].join('\\n'));

fs.writeFileSync(path.join(appsWorkerDir, '.dockerignore'), [
  "node_modules",
  "dist",
  ".env"
].join('\\n'));

console.log("Phase 10 Background Worker scaffolded.");
