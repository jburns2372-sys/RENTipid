/**
 * @jest-environment jsdom
 */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { readFileSync } from "fs";
import path from "path";
import React from "react";
import { IncidentCaseDetailClient } from "../../../src/components/security/cases/IncidentCaseDetailClient";
import { IncidentCaseListClient } from "../../../src/components/security/cases/IncidentCaseListClient";
import {
  INCIDENT_CASE_PERMISSIONS,
  IncidentCaseDetail,
  IncidentCaseListItem,
} from "../../../src/components/security/cases/incident-case-ui";

const analystPermissions = [
  INCIDENT_CASE_PERMISSIONS.VIEW,
  INCIDENT_CASE_PERMISSIONS.CREATE,
  INCIDENT_CASE_PERMISSIONS.TRIAGE,
  INCIDENT_CASE_PERMISSIONS.INVESTIGATE,
  INCIDENT_CASE_PERMISSIONS.ADD_NOTE,
  INCIDENT_CASE_PERMISSIONS.ADD_EVIDENCE,
];

const supervisorPermissions = [
  ...analystPermissions,
  INCIDENT_CASE_PERMISSIONS.ASSIGN,
  INCIDENT_CASE_PERMISSIONS.REASSIGN,
  INCIDENT_CASE_PERMISSIONS.REQUEST_CONTAINMENT,
  INCIDENT_CASE_PERMISSIONS.RESOLVE,
  INCIDENT_CASE_PERMISSIONS.CLOSE,
  INCIDENT_CASE_PERMISSIONS.REOPEN,
];

const assignees = [
  { id: "analyst-1", full_name: "Alex Analyst" },
  { id: "analyst-2", full_name: "Sam Responder" },
];

const listCase: IncidentCaseListItem = {
  id: "case-private-1",
  case_reference: "INC-20260724-ABCD1234",
  status: "OPEN",
  severity: "HIGH",
  origin: "MANUAL",
  title: "Suspicious access review",
  created_at: "2026-07-24T01:00:00.000Z",
  updated_at: "2026-07-24T02:00:00.000Z",
  opened_at: "2026-07-24T01:00:00.000Z",
  assigned_user: null,
  originating_security_event_id: "security-event-private-12345678",
  version: 1,
};

const detailCase: IncidentCaseDetail = {
  ...listCase,
  summary: "Authorized bounded case summary.",
  resolved_at: null,
  closed_at: null,
  reopened_at: null,
  created_by_user: { id: "creator-private", full_name: "Case Creator" },
  histories: [
    {
      id: "history-2",
      previous_status: "OPEN",
      new_status: "TRIAGED",
      reason: "TRIAGED",
      reason_note: "Second history entry.",
      occurred_at: "2026-07-24T03:00:00.000Z",
      actor_user: { id: "actor-private", full_name: "Alex Analyst" },
      assigned_to_user: null,
    },
    {
      id: "history-1",
      previous_status: null,
      new_status: "OPEN",
      reason: "CREATED",
      reason_note: null,
      occurred_at: "2026-07-24T01:00:00.000Z",
      actor_user: { id: "creator-private", full_name: "Case Creator" },
      assigned_to_user: null,
    },
  ],
  notes: [
    {
      id: "note-private-1",
      note_type: "INVESTIGATION",
      content: "Authorized investigation observation.",
      is_redacted: false,
      created_at: "2026-07-24T04:00:00.000Z",
      actor_user: { id: "actor-private", full_name: "Alex Analyst" },
    },
    {
      id: "note-private-2",
      note_type: "INTERNAL",
      content: null,
      is_redacted: true,
      created_at: "2026-07-24T05:00:00.000Z",
      actor_user: null,
    },
  ],
  evidences: [
    {
      id: "evidence-private-1",
      evidence_type: "SYSTEM_LOG",
      source: "INTERNAL_SYSTEM",
      collected_at: "2026-07-24T02:30:00.000Z",
      created_at: "2026-07-24T02:31:00.000Z",
      reference_key: "system-log:safe-reference",
      integrity_hash: "a".repeat(64),
      content_type: "application/json",
      size_bytes: 512,
      added_by_user: { id: "actor-private", full_name: "Alex Analyst" },
    },
  ],
};

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function listPayload(
  data: IncidentCaseListItem[] = [listCase],
  nextCursor: string | null = null,
) {
  return {
    data,
    pagination: { limit: 25, next_cursor: nextCursor },
  };
}

function detailPayload(data: IncidentCaseDetail = detailCase) {
  return { data };
}

function renderList(
  permissions: readonly string[] = analystPermissions,
  payload = listPayload(),
) {
  (global.fetch as jest.Mock).mockResolvedValue(response(payload));
  return render(
    <IncidentCaseListClient
      activePermissions={permissions}
      assigneeOptions={assignees}
    />,
  );
}

function renderDetail(
  permissions: readonly string[] = analystPermissions,
  data = detailCase,
) {
  (global.fetch as jest.Mock).mockResolvedValue(response(detailPayload(data)));
  return render(
    <IncidentCaseDetailClient
      caseId={data.id}
      activePermissions={permissions}
      assigneeOptions={assignees}
    />,
  );
}

beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe("Gate 4F Slice C5: authenticated incident-case management UI", () => {
  it("1. authorized case list loads safe summary fields", async () => {
    renderList();
    expect(await screen.findAllByText(listCase.case_reference)).toHaveLength(2);
    expect(screen.getAllByText("Alex Analyst").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Linked event/).length).toBeGreaterThan(0);
    expect(screen.queryByText(listCase.id)).toBeNull();
  });

  it("2. route uses the database-authoritative view guard for unauthorized denial", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/app/dashboard/admin/security/cases/page.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("requireSecurityPermission");
    expect(source).toContain("SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW");
  });

  it("3. analyst sees analyst-permitted create, triage, note, and evidence controls", async () => {
    renderDetail(analystPermissions, { ...detailCase, histories: [] });
    expect(await screen.findByRole("button", { name: "Mark triaged" })).not.toBeNull();
    expect(screen.getByRole("form", { name: "Add case note" })).not.toBeNull();
    expect(screen.getByRole("form", { name: "Add evidence reference" })).not.toBeNull();
    cleanup();
    renderList(analystPermissions);
    expect(await screen.findByRole("button", { name: "Create case" })).not.toBeNull();
  });

  it("4. analyst does not see supervisor-only assignment or lifecycle controls", async () => {
    renderDetail(analystPermissions, {
      ...detailCase,
      status: "INVESTIGATING",
      histories: [],
    });
    await screen.findByText(detailCase.case_reference);
    expect(screen.queryByRole("form", { name: "Case assignment" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Resolve case" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Request containment" })).toBeNull();
  });

  it("5. supervisor sees assignment and high-impact lifecycle controls", async () => {
    renderDetail(supervisorPermissions, {
      ...detailCase,
      status: "INVESTIGATING",
      histories: [],
    });
    expect(await screen.findByRole("form", { name: "Case assignment" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Resolve case" })).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Request containment" }),
    ).not.toBeNull();
  });

  it("6. cursor pagination requests the next C4 page", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response(listPayload([listCase], "cursor-next")))
      .mockResolvedValueOnce(response(listPayload([])));
    render(
      <IncidentCaseListClient
        activePermissions={analystPermissions}
        assigneeOptions={assignees}
      />,
    );
    const nextButton = screen.getByRole("button", { name: "Next" });
    await waitFor(() => expect(nextButton.hasAttribute("disabled")).toBe(false));
    fireEvent.click(nextButton);
    await waitFor(() =>
      expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain(
        "cursor=cursor-next",
      ),
    );
    await screen.findByText("No incident cases found");
    expect(screen.getByRole("button", { name: "Previous" }).hasAttribute("disabled")).toBe(false);
  });

  it("7. approved status, severity, origin, assignee, and SecurityEvent filters reach C4", async () => {
    renderList();
    await screen.findAllByText(listCase.case_reference);
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "OPEN" },
    });
    fireEvent.change(screen.getByLabelText("Severity"), {
      target: { value: "HIGH" },
    });
    fireEvent.change(screen.getByLabelText("Origin"), {
      target: { value: "MANUAL" },
    });
    fireEvent.change(screen.getByLabelText("Assignee"), {
      target: { value: "analyst-1" },
    });
    fireEvent.change(screen.getByLabelText("Linked SecurityEvent"), {
      target: { value: "event-safe" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBe(2));
    const url = (global.fetch as jest.Mock).mock.calls[1][0] as string;
    expect(url).toContain("status=OPEN");
    expect(url).toContain("severity=HIGH");
    expect(url).toContain("origin=MANUAL");
    expect(url).toContain("assigned_user_id=analyst-1");
    expect(url).toContain("security_event_id=event-safe");
  });

  it("8. empty C4 results render the deterministic empty state", async () => {
    renderList(analystPermissions, listPayload([]));
    expect(await screen.findByText("No incident cases found")).not.toBeNull();
    expect(screen.getByText(/match the current filters/)).not.toBeNull();
  });

  it("9. list API failure renders a safe retryable error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response({ error: { message: "Prisma SQL DATABASE_URL=private" } }, 500),
    );
    render(
      <IncidentCaseListClient
        activePermissions={analystPermissions}
        assigneeOptions={assignees}
      />,
    );
    expect(
      await screen.findByText(
        "Case management is temporarily unavailable. Please try again.",
      ),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Try again" })).not.toBeNull();
  });

  it("10. detail renders history in deterministic chronological order", async () => {
    const { container } = renderDetail();
    await screen.findByText("Second history entry.");
    const entries = Array.from(container.querySelectorAll("ol > li"));
    expect(entries).toHaveLength(2);
    expect(entries[0].textContent).toContain("Created");
    expect(entries[1].textContent).toContain("Triaged");
  });

  it("11. notes render only authorized content and safe actor summaries", async () => {
    const { container } = renderDetail();
    expect(await screen.findByText("Authorized investigation observation.")).not.toBeNull();
    expect(screen.getByText("Note content redacted.")).not.toBeNull();
    expect(container.textContent).not.toContain("actor-private");
    expect(container.textContent).not.toContain("note-private");
  });

  it("12. evidence renders references and safe metadata without raw private IDs", async () => {
    const { container } = renderDetail();
    expect(await screen.findByText("system-log:safe-reference")).not.toBeNull();
    expect(screen.getByText("application/json")).not.toBeNull();
    expect(screen.getByText("512 bytes")).not.toBeNull();
    expect(container.textContent).not.toContain("evidence-private");
    expect(container.textContent).not.toContain("a".repeat(64));
  });

  it("13. case creation submits through the published C4 collection route", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      async (url: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          return response({ data: { incident_case: listCase } }, 201);
        }
        return response(listPayload());
      },
    );
    render(
      <IncidentCaseListClient
        activePermissions={analystPermissions}
        assigneeOptions={assignees}
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Create case" }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New bounded case" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create open case" }));
    expect(await screen.findByText("Case created with initial status Open.")).not.toBeNull();
    const postCall = (global.fetch as jest.Mock).mock.calls.find(
      (call) => call[1]?.method === "POST",
    );
    expect(postCall?.[0]).toBe("/api/admin/security/cases");
  });

  it("14. creation fixes initial status to OPEN and offers no alternative", async () => {
    renderList();
    fireEvent.click(await screen.findByRole("button", { name: "Create case" }));
    const status = screen.getByLabelText("Initial status") as HTMLInputElement;
    expect(status.readOnly).toBe(true);
    expect(status.value).toBe("OPEN");
    expect(
      within(screen.getByLabelText("Initial status").closest("section")!).queryByRole(
        "option",
        { name: "Closed" },
      ),
    ).toBeNull();
  });

  it("15. approved analyst transition succeeds through the C4 status route", async () => {
    let current = { ...detailCase, histories: [] };
    (global.fetch as jest.Mock).mockImplementation(
      async (url: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          const body = JSON.parse(String(init.body));
          current = { ...current, status: body.new_status, version: 2 };
          return response({ data: {} });
        }
        return response(detailPayload(current));
      },
    );
    render(
      <IncidentCaseDetailClient
        caseId={detailCase.id}
        activePermissions={analystPermissions}
        assigneeOptions={assignees}
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Mark triaged" }));
    expect(await screen.findByText("Case status changed to Triaged.")).not.toBeNull();
    const postCall = (global.fetch as jest.Mock).mock.calls.find(
      (call) => call[1]?.method === "POST",
    );
    expect(postCall?.[0]).toContain("/status");
  });

  it("16. prohibited lifecycle control remains unavailable", async () => {
    renderDetail(analystPermissions, {
      ...detailCase,
      status: "RESOLVED",
      histories: [],
    });
    await screen.findByText(detailCase.case_reference);
    expect(screen.queryByRole("button", { name: "Close case" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reopen case" })).toBeNull();
  });

  it("17. a 409 transition conflict refreshes authoritative case state", async () => {
    const refreshed = {
      ...detailCase,
      status: "TRIAGED" as const,
      version: 2,
      histories: [],
    };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response(detailPayload({ ...detailCase, histories: [] })))
      .mockResolvedValueOnce(response({ error: { code: "STALE_TRANSITION_CONFLICT" } }, 409))
      .mockResolvedValueOnce(response(detailPayload(refreshed)));
    render(
      <IncidentCaseDetailClient
        caseId={detailCase.id}
        activePermissions={analystPermissions}
        assigneeOptions={assignees}
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Mark triaged" }));
    expect(await screen.findByText(/latest state has been loaded/)).not.toBeNull();
    expect(screen.getByText("Status: Triaged")).not.toBeNull();
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(3);
  });

  it("18. supervisor assignment submits a valid selected user without changing status", async () => {
    let current = { ...detailCase, status: "TRIAGED" as const, histories: [] };
    (global.fetch as jest.Mock).mockImplementation(
      async (_url: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          current = {
            ...current,
            assigned_user: assignees[1],
            version: 2,
          };
          return response({ data: {} });
        }
        return response(detailPayload(current));
      },
    );
    render(
      <IncidentCaseDetailClient
        caseId={detailCase.id}
        activePermissions={supervisorPermissions}
        assigneeOptions={assignees}
      />,
    );
    fireEvent.change(await screen.findByLabelText("Assign to"), {
      target: { value: "analyst-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Assign case" }));
    expect(await screen.findByText(/Case assigned.*status was not changed/)).not.toBeNull();
    const postCall = (global.fetch as jest.Mock).mock.calls.find(
      (call) => call[1]?.method === "POST",
    );
    const body = JSON.parse(String(postCall?.[1]?.body));
    expect(body.assignee_user_id).toBe("analyst-2");
    expect(body.status).toBeUndefined();
  });

  it("19. same-assignee conflict is handled safely without an API mutation", async () => {
    renderDetail(supervisorPermissions, {
      ...detailCase,
      assigned_user: assignees[0],
      histories: [],
    });
    const form = await screen.findByRole("form", { name: "Case assignment" });
    fireEvent.submit(form);
    expect(await screen.findByText(/already assigned/)).not.toBeNull();
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1);
  });

  it("20. note append succeeds and clears sensitive form state", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      async (_url: string, init?: RequestInit) =>
        init?.method === "POST"
          ? response({ data: {} })
          : response(detailPayload({ ...detailCase, histories: [] })),
    );
    render(
      <IncidentCaseDetailClient
        caseId={detailCase.id}
        activePermissions={analystPermissions}
        assigneeOptions={assignees}
      />,
    );
    const noteForm = await screen.findByRole("form", { name: "Add case note" });
    const note = within(noteForm).getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(note, { target: { value: "New bounded note." } });
    fireEvent.click(screen.getByRole("button", { name: "Append note" }));
    expect(await screen.findByText("Note appended to the case.")).not.toBeNull();
    expect(note.value).toBe("");
    expect(window.confirm).toHaveBeenCalled();
  });

  it("21. evidence-reference append succeeds with bounded C4 metadata", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      async (_url: string, init?: RequestInit) =>
        init?.method === "POST"
          ? response({ data: {} })
          : response(detailPayload({ ...detailCase, histories: [] })),
    );
    render(
      <IncidentCaseDetailClient
        caseId={detailCase.id}
        activePermissions={analystPermissions}
        assigneeOptions={assignees}
      />,
    );
    fireEvent.change(await screen.findByLabelText("Reference"), {
      target: { value: "system-log:new-reference" },
    });
    fireEvent.change(screen.getByLabelText("SHA-256 integrity hash"), {
      target: { value: "b".repeat(64) },
    });
    fireEvent.change(screen.getByLabelText("Collected at"), {
      target: { value: "2026-07-24T12:00" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Append evidence reference" }),
    );
    expect(
      await screen.findByText("Evidence reference appended to the case."),
    ).not.toBeNull();
    const postCall = (global.fetch as jest.Mock).mock.calls.find(
      (call) => call[1]?.method === "POST",
    );
    expect(postCall?.[0]).toContain("/evidence");
  });

  it("22. failed mutation shows no false success", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      async (_url: string, init?: RequestInit) =>
        init?.method === "POST"
          ? response({ error: { message: "private SQL" } }, 500)
          : response(detailPayload({ ...detailCase, histories: [] })),
    );
    render(
      <IncidentCaseDetailClient
        caseId={detailCase.id}
        activePermissions={analystPermissions}
        assigneeOptions={assignees}
      />,
    );
    const noteForm = await screen.findByRole("form", { name: "Add case note" });
    fireEvent.change(within(noteForm).getByRole("textbox"), {
      target: { value: "Will fail safely." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Append note" }));
    expect(
      await screen.findByText("Case management is temporarily unavailable. Please try again."),
    ).not.toBeNull();
    expect(screen.queryByText("Note appended to the case.")).toBeNull();
  });

  it("23. no UI component performs a direct Prisma mutation", () => {
    const files = [
      "src/components/security/cases/IncidentCaseListClient.tsx",
      "src/components/security/cases/IncidentCaseDetailClient.tsx",
      "src/app/dashboard/admin/security/cases/page.tsx",
      "src/app/dashboard/admin/security/cases/[caseId]/page.tsx",
    ];
    const source = files
      .map((file) => readFileSync(path.join(process.cwd(), file), "utf8"))
      .join("\n");
    expect(source).not.toMatch(
      /prisma\.[a-zA-Z]+\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
    );
    expect(source).not.toContain('"use server"');
  });

  it("24. UI errors never display credentials, tokens, database URLs, or connection details", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response(
        {
          error: {
            message:
              "password=private access_token=private DATABASE_URL=postgresql://private connection_string=private",
          },
        },
        500,
      ),
    );
    const { container } = render(
      <IncidentCaseListClient
        activePermissions={analystPermissions}
        assigneeOptions={assignees}
      />,
    );
    await screen.findByRole("alert");
    expect(container.textContent).not.toMatch(
      /password|access_token|database_url|postgresql:\/\/|connection_string/i,
    );
  });

  it("25. desktop layout provides the targeted table rendering", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/components/security/cases/IncidentCaseListClient.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("hidden overflow-hidden");
    expect(source).toContain("md:block");
    expect(source).toContain("<table");
  });

  it("26. tablet layout uses bounded responsive grids without blocking overflow", () => {
    const sources = [
      "src/components/security/cases/IncidentCaseListClient.tsx",
      "src/components/security/cases/IncidentCaseDetailClient.tsx",
    ]
      .map((file) => readFileSync(path.join(process.cwd(), file), "utf8"))
      .join("\n");
    expect(sources).toContain("md:grid-cols-2");
    expect(sources).toContain("min-w-0");
    expect(sources).not.toMatch(/min-w-\[(?:[4-9]\d\d|\d{4,})px\]/);
  });

  it("27. mobile layout collapses cases into cards and preserves wrapping", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/components/security/cases/IncidentCaseListClient.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("md:hidden");
    expect(source).toContain("<article");
    expect(source).toContain("break-words");
  });

  it("28. keyboard-focusable controls and accessible labels remain available", async () => {
    renderList();
    const status = await screen.findByLabelText("Status");
    const apply = screen.getByRole("button", { name: "Apply filters" });
    status.focus();
    expect(document.activeElement).toBe(status);
    apply.focus();
    expect(document.activeElement).toBe(apply);
    expect(screen.getByRole("navigation", { name: "Case result pages" })).not.toBeNull();
  });
});
