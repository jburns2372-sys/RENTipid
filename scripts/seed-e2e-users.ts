import { PrismaClient } from '@prisma/client';
import { upsertSeededEmailPasswordUser } from '../src/lib/auth/seed/upsert-seeded-user';

// Since the DB URL is provided via environment, we just instantiate the client.
const prisma = new PrismaClient();

async function main() {
  console.log(`[Seed] Connected to E2E Database.`);

  const plainPassword = process.env.E2E_SEED_PASSWORD || 'TestPassword123!';

  const testUsers = [
    { id: 'e2e_address_1', email: 'e2e_address_test@example.com', type: 'Individual Provider' },
    { id: 'e2e_address_c', email: 'e2e_address_c@example.com', type: 'Individual Provider' },
    { id: 'e2e_address_d', email: 'e2e_address_d@example.com', type: 'Individual Provider' },
    { id: 'e2e_address_f', email: 'e2e_address_f@example.com', type: 'Individual Provider' },
    { id: 'e2e_business_1', email: 'e2e_business_test@example.com', type: 'Business Provider' }
  ];

  for (const tu of testUsers) {
    await upsertSeededEmailPasswordUser(prisma, {
      email: tu.email,
      fullName: tu.id,
      accountType: tu.type === 'Business Provider' ? 'Business' : 'Individual',
      role: tu.type,
      status: 'Verified',
      plainPassword,
      isVerifiedCredential: true,
    });
  }

  console.log(`[Seed] Deterministic users seeded via canonical auth seeder.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
