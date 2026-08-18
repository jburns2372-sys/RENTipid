import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs'; // Optional if RENTipid requires real hash, or simple fallback if NextAuth credentials uses simple matching in test.

// Since the DB URL is provided via environment, we just instantiate the client.
const prisma = new PrismaClient();

async function main() {
  console.log(`[Seed] Connected to E2E Database.`);

  const passwordHash = hashSync('TestPassword123!', 10);

  const testUsers = [
    { id: 'e2e_address_1', email: 'e2e_address_test@example.com', type: 'Individual Provider' },
    { id: 'e2e_address_c', email: 'e2e_address_c@example.com', type: 'Individual Provider' },
    { id: 'e2e_address_d', email: 'e2e_address_d@example.com', type: 'Individual Provider' },
    { id: 'e2e_address_f', email: 'e2e_address_f@example.com', type: 'Individual Provider' },
    { id: 'e2e_business_1', email: 'e2e_business_test@example.com', type: 'Business Provider' }
  ];

  for (const tu of testUsers) {
    await prisma.user.upsert({
      where: { email: tu.email },
      update: {},
      create: {
        id: tu.id,
        email: tu.email,
        full_name: tu.id,
        account_type: tu.type === 'Business Provider' ? 'Business' : 'Individual',
        role: tu.type,
        status: 'Verified',
        password_hash: passwordHash,
        profile: {
          create: {
            verification_status: 'Unverified'
          }
        },
        ...(tu.type === 'Business Provider' ? {
          businessProfile: {
            create: {
              business_name: 'E2E Business Corp',
              verification_status: 'Unverified'
            }
          }
        } : {})
      }
    });
  }

  console.log(`[Seed] Deterministic users seeded.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
