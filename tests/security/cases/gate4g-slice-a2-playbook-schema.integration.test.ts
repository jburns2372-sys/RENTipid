import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

describe("Gate 4G Slice A2 Playbook Schema Foundation", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create a SecurityResponsePlaybook and its immutable version", async () => {
    const playbookId = randomUUID();
    
    const playbook = await prisma.securityResponsePlaybook.create({
      data: {
        playbook_id: playbookId,
        version: 1,
        name: "Test Containment Playbook",
        description: "Integration test playbook for A2 schema",
        status: "DRAFT",
      },
    });

    expect(playbook).toBeDefined();
    expect(playbook.playbook_id).toBe(playbookId);
    expect(playbook.version).toBe(1);
    expect(playbook.status).toBe("DRAFT");
  });

  it("should enforce deterministic step ordering within a playbook version", async () => {
    const playbookId = randomUUID();
    
    const playbook = await prisma.securityResponsePlaybook.create({
      data: {
        playbook_id: playbookId,
        version: 1,
        name: "Test Step Playbook",
        description: "Testing deterministic step creation",
        status: "DRAFT",
        steps: {
          create: [
            {
              step_order: 1,
              action_type: "ACCOUNT_RESTRICTION",
              human_instruction: "Lock user account",
              reversibility: "REVERSIBLE",
              risk_level: "HIGH",
              approval_required: true,
            },
            {
              step_order: 2,
              action_type: "SESSION_REVOCATION",
              human_instruction: "Revoke all active sessions",
              reversibility: "REVERSIBLE",
              risk_level: "HIGH",
              approval_required: false,
            }
          ]
        }
      },
      include: {
        steps: {
          orderBy: { step_order: "asc" }
        }
      }
    });

    expect(playbook.steps.length).toBe(2);
    expect(playbook.steps[0].step_order).toBe(1);
    expect(playbook.steps[1].step_order).toBe(2);
    expect(playbook.steps[0].action_type).toBe("ACCOUNT_RESTRICTION");
    
    // Test unique constraint on step_order
    await expect(
      prisma.securityResponseStep.create({
        data: {
          playbook_id: playbookId,
          playbook_version: 1,
          step_order: 1, // Duplicate order
          action_type: "PAYMENT_FREEZE",
          human_instruction: "Freeze payments",
          reversibility: "REVERSIBLE",
          risk_level: "HIGH",
          approval_required: true,
        }
      })
    ).rejects.toThrow();
  });

  it("should reject duplicate versions of the same playbook", async () => {
    const playbookId = randomUUID();
    
    await prisma.securityResponsePlaybook.create({
      data: {
        playbook_id: playbookId,
        version: 1,
        name: "Duplicate Version Test",
        description: "Test",
        status: "ACTIVE",
      },
    });

    await expect(
      prisma.securityResponsePlaybook.create({
        data: {
          playbook_id: playbookId,
          version: 1, // Same version
          name: "Duplicate Version Test 2",
          description: "Test 2",
          status: "DRAFT",
        },
      })
    ).rejects.toThrow();
  });

  it("should successfully create an approval request, decision, and bounded grant", async () => {
    // 1. Setup mock user
    const user = await prisma.user.create({
      data: {
        email: `test-approver-${randomUUID()}@example.com`,
        full_name: "Test Approver",
        account_type: "Individual",
        role: "SOC_SUPERVISOR",
        status: "Verified",
      }
    });

    // 2. Setup mock incident case
    const incidentCase = await prisma.incidentCase.create({
      data: {
        case_reference: `INC-20260724-${randomUUID().substring(0, 8).toUpperCase()}`,
        status: "OPEN",
        severity: "HIGH",
        origin: "MANUAL",
        title: "Test Case",
        opened_at: new Date(),
      }
    });

    // 3. Setup playbook
    const playbookId = randomUUID();
    await prisma.securityResponsePlaybook.create({
      data: {
        playbook_id: playbookId,
        version: 1,
        name: "Approval Test Playbook",
        description: "Test",
        status: "ACTIVE",
      }
    });

    // 4. Create case-playbook link
    const link = await prisma.incidentCasePlaybookLink.create({
      data: {
        incident_case_id: incidentCase.id,
        playbook_id: playbookId,
        playbook_version: 1,
      }
    });

    expect(link).toBeDefined();

    // 5. Create approval request
    const requestIdempotency = randomUUID();
    const request = await prisma.securityResponseApprovalRequest.create({
      data: {
        requester_id: user.id,
        incident_case_id: incidentCase.id,
        playbook_id: playbookId,
        playbook_version: 1,
        status: "PENDING",
        justification: "Critical containment required",
        idempotency_key: requestIdempotency,
      }
    });

    expect(request).toBeDefined();
    expect(request.idempotency_key).toBe(requestIdempotency);

    // 6. Create approval decision (append-only ledger)
    const decisionIdempotency = randomUUID();
    const decision = await prisma.securityResponseApprovalDecision.create({
      data: {
        request_id: request.id,
        event_type: "APPROVED",
        actor_id: user.id,
        reason: "Authorized",
        idempotency_key: decisionIdempotency,
      }
    });

    expect(decision).toBeDefined();
    expect(decision.event_type).toBe("APPROVED");

    // 7. Create bounded grant
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    const grant = await prisma.securityResponseApprovalGrant.create({
      data: {
        request_id: request.id,
        incident_case_id: incidentCase.id,
        playbook_id: playbookId,
        playbook_version: 1,
        grant_state: "AVAILABLE",
        expires_at: expiresAt,
      }
    });

    expect(grant).toBeDefined();
    expect(grant.grant_state).toBe("AVAILABLE");
  });
});
