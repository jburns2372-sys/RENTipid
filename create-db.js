const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$executeRawUnsafe('CREATE DATABASE rentipid_test_soc_gate4b1_replay')
  .then(() => console.log('Database created'))
  .catch(e => {
    // ignore if exists
    console.log(e.message);
  })
  .finally(() => prisma.$disconnect());
