const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs', 'azure-migration');

// 00-production-baseline.md
fs.writeFileSync(path.join(docsDir, '00-production-baseline.md'), `# Phase 0 - Production Baseline

- **Current production URL**: (Pending verification)
- **Current Vercel project**: rentipid
- **Node.js version**: ^20
- **Next.js version**: 16.2.10
- **Prisma version**: ^6.19.3
- **Authentication package**: next-auth ^4.24.14
- **Database provider**: sqlite (Needs migration to Postgres)
- **Storage provider**: Local/Vercel (Needs migration to Azure Blob Storage)
- **Payment mode**: PayMongo (Pending key verification)
- **Scheduled jobs**: None discovered locally yet.
- **Current feature flags**: None discovered locally yet.
`);

// 01-dependency-map.md
fs.writeFileSync(path.join(docsDir, '01-dependency-map.md'), `# Phase 1 - Dependency Map

## Frontend Dependencies
- \`next@16.2.10\`
- \`react@19.2.4\`
- \`tailwindcss@4\`
- \`shadcn\`, \`lucide-react\`

## Backend Dependencies
- \`next-auth@4.24.14\`
- \`@prisma/client@6.19.3\`
- \`bcryptjs@3.0.3\`

## Mobile Dependencies
- \`@capacitor/core@8.4.1\`

## External Integrations
- Prisma (Database ORM)
- NextAuth (Authentication)
`);

// Rename 02-migration-risk-register to 01-risk-register
if (fs.existsSync(path.join(docsDir, '02-migration-risk-register.md'))) {
  fs.renameSync(
    path.join(docsDir, '02-migration-risk-register.md'), 
    path.join(docsDir, '01-risk-register.md')
  );
}

console.log("Documents aligned with Rentipid Master Prompt.");
