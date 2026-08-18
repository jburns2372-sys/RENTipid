const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const logs = await prisma.ruleEvaluationLog.findMany();
  console.log("Evaluation Logs:", logs);
  const events = await prisma.securityEvent.findMany();
  console.log("Events:", events);
  await prisma.$disconnect();
}
run();
