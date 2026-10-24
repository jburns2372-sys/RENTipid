import { PrismaClient } from '@prisma/client';
import { runMarketplaceSampleSeed } from '../src/lib/marketplace/seed-reconciler';
import { seedListingBridgeSystemSettings } from '../src/lib/listingbridge';
import { CANONICAL_CATEGORIES } from '../src/lib/categories/canonical-categories';
import { upsertSeededEmailPasswordUser } from '../src/lib/auth/seed/upsert-seeded-user';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 1 Categories...');

  for (const cat of CANONICAL_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        risk_level: cat.risk_level,
        requires_admin_approval: cat.requires_admin_approval || false,
        requires_deposit: cat.requires_deposit || false,
        requires_insurance: cat.requires_insurance || false,
        requires_permit: cat.requires_permit || false,
      },
    });
  }

  console.log('Seeding System Settings Placeholders...');

  const settings = [
    { key: 'platform_commission', value: '10%', description: 'Default platform commission fee' },
    { key: 'allow_new_registrations', value: 'true', description: 'Enable or disable new signups' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { setting_key: setting.key },
      update: {},
      create: {
        setting_key: setting.key,
        setting_value: setting.value,
        description: setting.description,
      },
    });
  }

  console.log('Seeding ListingBridge System Settings...');
  await seedListingBridgeSystemSettings(prisma);

  console.log('Seeding Development Accounts via canonical auth seeder...');
  const plainPassword = process.env.SEED_DEFAULT_PASSWORD || 'password123';

  const users: Array<{
    email: string;
    full_name: string;
    account_type: 'Individual' | 'Business';
    role: string;
    status: 'Pending' | 'Verified';
  }> = [
    { email: "superadmin@rentipid.local", full_name: "Super Admin User", account_type: "Individual", role: "Super Admin", status: "Verified" },
    { email: "admin@rentipid.local", full_name: "Compliance Admin", account_type: "Individual", role: "Compliance Admin", status: "Verified" },
    { email: "finance@rentipid.local", full_name: "Finance Admin", account_type: "Individual", role: "Finance Admin", status: "Verified" },
    { email: "renter@rentipid.local", full_name: "Sample Renter", account_type: "Individual", role: "Renter", status: "Verified" },
    { email: "provider@rentipid.local", full_name: "Sample Provider", account_type: "Individual", role: "Individual Provider", status: "Verified" },
    { email: "business@rentipid.local", full_name: "Sample Business", account_type: "Business", role: "Business Provider", status: "Verified" },
  ];

  for (const user of users) {
    await upsertSeededEmailPasswordUser(prisma, {
      email: user.email,
      fullName: user.full_name,
      accountType: user.account_type,
      role: user.role,
      status: user.status,
      plainPassword,
    });
  }

  console.log('Seeding complete.');
}

(process.env.ALLOW_MARKETPLACE_SAMPLE_SEED === 'true'
  ? () => runMarketplaceSampleSeed(prisma)
  : main)()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
