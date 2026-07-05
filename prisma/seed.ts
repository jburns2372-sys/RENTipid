import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 1 Categories...');

  const categories = [
    { name: 'Tools', slug: 'tools', risk_level: 'Low', description: 'Power tools, hand tools, and gardening equipment.' },
    { name: 'Construction Equipment', slug: 'construction-equipment', risk_level: 'Medium', description: 'Scaffolding, cement mixers, and generators.', requires_deposit: true },
    { name: 'Heavy Equipment', slug: 'heavy-equipment', risk_level: 'High', requires_admin_approval: true, requires_deposit: true, requires_insurance: true },
    { name: 'Event Equipment', slug: 'event-equipment', risk_level: 'Low', description: 'Tents, chairs, tables, and sound systems.' },
    { name: 'Cameras and Gadgets', slug: 'cameras-and-gadgets', risk_level: 'Medium', requires_deposit: true },
    { name: 'Cars and Motorcycles', slug: 'cars-and-motorcycles', risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_insurance: true, requires_permit: true },
    { name: 'Trucks and Commercial Vehicles', slug: 'trucks-and-commercial-vehicles', risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_insurance: true, requires_permit: true },
    { name: 'Condominiums', slug: 'condominiums', risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_permit: true },
    { name: 'Rooms', slug: 'rooms', risk_level: 'Medium', requires_deposit: true },
    { name: 'Beach Resorts', slug: 'beach-resorts', risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_permit: true },
    { name: 'Event Venues', slug: 'event-venues', risk_level: 'Medium', requires_deposit: true },
    { name: 'Office Equipment', slug: 'office-equipment', risk_level: 'Low' },
    { name: 'Boats', slug: 'boats', risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_insurance: true, requires_permit: true },
    { name: 'Aircraft / Helicopter Charter Inquiry Only', slug: 'aircraft-charter', risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_insurance: true, requires_permit: true },
    { name: 'Other Legally Rentable Assets', slug: 'other', risk_level: 'Medium' }
  ];

  for (const cat of categories) {
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

  console.log('Seeding Development Accounts...');
  
  // Basic bcrypt hash for "password123"
  const password_hash = "$2a$10$wT/X200D8J8eC2dK4X0aZe5H.Jj7Ew1B6Gz9X9u6wZ1E8Q8J2B6G.";

  const users = [
    { email: "superadmin@rentipid.local", full_name: "Super Admin User", account_type: "Individual", role: "Super Admin", status: "Verified" },
    { email: "admin@rentipid.local", full_name: "Compliance Admin", account_type: "Individual", role: "Compliance Admin", status: "Verified" },
    { email: "finance@rentipid.local", full_name: "Finance Admin", account_type: "Individual", role: "Finance Admin", status: "Verified" },
    { email: "renter@rentipid.local", full_name: "Sample Renter", account_type: "Individual", role: "Renter", status: "Pending" },
    { email: "provider@rentipid.local", full_name: "Sample Provider", account_type: "Individual", role: "Individual Provider", status: "Pending" },
    { email: "business@rentipid.local", full_name: "Sample Business", account_type: "Business", role: "Business Provider", status: "Pending" },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        full_name: user.full_name,
        account_type: user.account_type,
        role: user.role,
        status: user.status,
        password_hash,
      },
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
