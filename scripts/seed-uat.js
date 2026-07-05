const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding Phase 11 UAT Flows and Issues...");

  // Seed UAT Flows
  const uatFlows = [
    { flow_name: "Flow 1: Renter Registration and KYC", role: "Renter", assigned_tester: "Beta Tester A", status: "Passed", pass_fail_result: "Passed", issues_found: "None" },
    { flow_name: "Flow 2: Provider Registration and KYC", role: "Business Provider", assigned_tester: "Beta Tester B", status: "Passed", pass_fail_result: "Passed", issues_found: "None" },
    { flow_name: "Flow 3: Listing Creation and Approval", role: "Business Provider", assigned_tester: "Beta Tester B", status: "Passed", pass_fail_result: "Passed", issues_found: "Category selection UI was slightly confusing but functional." },
    { flow_name: "Flow 4: Booking and Mock Payment", role: "Renter", assigned_tester: "Beta Tester A", status: "Passed", pass_fail_result: "Passed", issues_found: "Mock checkout button was hard to see on mobile." },
    { flow_name: "Flow 5: Pre-Rental Inspection and Turnover", role: "Renter", assigned_tester: "Beta Tester A", status: "Failed", pass_fail_result: "Failed", issues_found: "Inspection form crashes when uploading > 5mb image." },
    { flow_name: "Flow 6: Return and Full Deposit Release", role: "Renter", assigned_tester: "Beta Tester A", status: "Passed", pass_fail_result: "Passed", issues_found: "None" },
    { flow_name: "Flow 7: Damage Claim and Dispute", role: "Business Provider", assigned_tester: "Beta Tester C", status: "Passed", pass_fail_result: "Passed", issues_found: "None" },
    { flow_name: "Flow 8: AI Assistant Guardrail Test", role: "Renter", assigned_tester: "Beta Tester D", status: "Passed", pass_fail_result: "Passed", issues_found: "AI successfully refused to approve KYC." },
    { flow_name: "Flow 9: Marketing Mock Promotion", role: "Business Provider", assigned_tester: "Beta Tester C", status: "Failed", pass_fail_result: "Failed", issues_found: "Mock adapter timeout during campaign generation." },
    { flow_name: "Flow 10: Support and Feedback", role: "Renter", assigned_tester: "Beta Tester D", status: "Passed", pass_fail_result: "Passed", issues_found: "None" }
  ];

  for (const flow of uatFlows) {
    await prisma.uATFlow.create({ data: flow });
  }

  // Seed Issues from the Failed flows
  await prisma.issueTicket.create({
    data: {
      issue_title: "Inspection Image Upload Crash",
      description: "Uploading a 6MB image during pre-rental inspection crashes the frontend without throwing an error message.",
      source: "UAT",
      module: "Inspections",
      severity: "High",
      priority: "High",
      status: "In Progress",
      assigned_to: "Dev Team",
      steps_to_reproduce: "1. Go to pre-rental inspection\n2. Attach 6MB file\n3. Click upload\n4. Screen freezes"
    }
  });

  await prisma.issueTicket.create({
    data: {
      issue_title: "Social Mock Adapter Timeout",
      description: "When generating a marketing campaign, the mock adapter waits too long and triggers a Vercel 10s timeout.",
      source: "UAT",
      module: "Marketing",
      severity: "Medium",
      priority: "Normal",
      status: "Fixed",
      assigned_to: "Dev Team",
      resolution_notes: "Reduced mock adapter artificial delay from 12s to 2s."
    }
  });

  console.log("Seeding complete.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
