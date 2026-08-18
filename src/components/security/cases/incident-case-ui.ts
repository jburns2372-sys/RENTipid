export const INCIDENT_CASE_PERMISSIONS = {
  VIEW: "security.incident_cases.view",
  CREATE: "security.incident_cases.create",
  TRIAGE: "security.incident_cases.triage",
  INVESTIGATE: "security.incident_cases.investigate",
  ASSIGN: "security.incident_cases.assign",
  REASSIGN: "security.incident_cases.reassign",
  ADD_NOTE: "security.incident_cases.add_note",
  ADD_EVIDENCE: "security.incident_cases.add_evidence",
  REQUEST_CONTAINMENT: "security.incident_cases.request_containment",
  RESOLVE: "security.incident_cases.resolve",
  CLOSE: "security.incident_cases.close",
  REOPEN: "security.incident_cases.reopen",
} as const;

export const CASE_STATUSES = [
  "OPEN",
  "TRIAGED",
  "INVESTIGATING",
  "CONTAINMENT_PENDING",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
] as const;

export const CASE_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const CASE_ORIGINS = [
  "MANUAL",
  "SECURITY_EVENT",
  "SECURITY_ALERT",
  "EXTERNAL_PROVIDER",
  "ADMIN_ESCALATION",
] as const;

export const CREATE_CASE_ORIGINS = ["MANUAL", "SECURITY_EVENT"] as const;

export const CASE_NOTE_TYPES = [
  "TRIAGE",
  "INVESTIGATION",
  "EVIDENCE_REVIEW",
  "ESCALATION",
  "RESOLUTION",
  "CLOSURE",
  "REOPENING",
  "INTERNAL",
] as const;

export const CASE_EVIDENCE_TYPES = [
  "SECURITY_EVENT",
  "AUDIT_LOG",
  "SYSTEM_LOG",
  "PROVIDER_EVENT",
  "TRANSACTION_REFERENCE",
  "DOCUMENT_REFERENCE",
  "IMAGE_REFERENCE",
  "USER_STATEMENT",
  "OTHER",
] as const;

export const CASE_EVIDENCE_SOURCES = [
  "INTERNAL_SYSTEM",
  "EXTERNAL_PROVIDER",
  "USER_SUBMITTED",
  "ADMINISTRATIVE",
] as const;

export const EVIDENCE_REFERENCE_PREFIX: Record<CaseEvidenceType, string> = {
  SECURITY_EVENT: "security-event:",
  AUDIT_LOG: "audit-log:",
  SYSTEM_LOG: "system-log:",
  PROVIDER_EVENT: "provider-event:",
  TRANSACTION_REFERENCE: "transaction:",
  DOCUMENT_REFERENCE: "document:",
  IMAGE_REFERENCE: "image:",
  USER_STATEMENT: "user-statement:",
  OTHER: "other:",
};

export type CaseStatus = (typeof CASE_STATUSES)[number];
export type CaseSeverity = (typeof CASE_SEVERITIES)[number];
export type CaseOrigin = (typeof CASE_ORIGINS)[number];
export type CaseNoteType = (typeof CASE_NOTE_TYPES)[number];
export type CaseEvidenceType = (typeof CASE_EVIDENCE_TYPES)[number];
export type CaseEvidenceSource = (typeof CASE_EVIDENCE_SOURCES)[number];

export type AssigneeOption = {
  id: string;
  full_name: string;
};

export type CaseUserSummary = AssigneeOption;

export type IncidentCaseListItem = {
  id: string;
  case_reference: string;
  status: CaseStatus;
  severity: CaseSeverity;
  origin: CaseOrigin;
  title: string;
  created_at: string;
  updated_at: string;
  opened_at: string;
  assigned_user: CaseUserSummary | null;
  originating_security_event_id: string | null;
  version: number;
};

export type IncidentCaseHistoryItem = {
  id: string;
  previous_status: CaseStatus | null;
  new_status: CaseStatus;
  reason: string;
  reason_note: string | null;
  occurred_at: string;
  actor_user: CaseUserSummary | null;
  assigned_to_user: CaseUserSummary | null;
};

export type IncidentCaseNoteItem = {
  id: string;
  note_type: CaseNoteType;
  content: string | null;
  is_redacted: boolean;
  created_at: string;
  actor_user: CaseUserSummary | null;
};

export type IncidentCaseEvidenceItem = {
  id: string;
  evidence_type: CaseEvidenceType;
  source: CaseEvidenceSource;
  collected_at: string;
  created_at: string;
  reference_key: string;
  integrity_hash: string;
  content_type: string | null;
  size_bytes: number | null;
  added_by_user: CaseUserSummary | null;
};

export type IncidentCaseDetail = IncidentCaseListItem & {
  summary: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  reopened_at: string | null;
  created_by_user: CaseUserSummary | null;
  histories: IncidentCaseHistoryItem[];
  notes: IncidentCaseNoteItem[];
  evidences: IncidentCaseEvidenceItem[];
};

export type TransitionOption = {
  status: CaseStatus;
  label: string;
  permission: string;
  highImpact: boolean;
};

export const TRANSITION_OPTIONS: Record<CaseStatus, readonly TransitionOption[]> = {
  OPEN: [
    {
      status: "TRIAGED",
      label: "Mark triaged",
      permission: INCIDENT_CASE_PERMISSIONS.TRIAGE,
      highImpact: false,
    },
  ],
  TRIAGED: [
    {
      status: "INVESTIGATING",
      label: "Start investigation",
      permission: INCIDENT_CASE_PERMISSIONS.INVESTIGATE,
      highImpact: false,
    },
    {
      status: "CONTAINMENT_PENDING",
      label: "Request containment",
      permission: INCIDENT_CASE_PERMISSIONS.REQUEST_CONTAINMENT,
      highImpact: true,
    },
  ],
  INVESTIGATING: [
    {
      status: "CONTAINMENT_PENDING",
      label: "Request containment",
      permission: INCIDENT_CASE_PERMISSIONS.REQUEST_CONTAINMENT,
      highImpact: true,
    },
    {
      status: "RESOLVED",
      label: "Resolve case",
      permission: INCIDENT_CASE_PERMISSIONS.RESOLVE,
      highImpact: true,
    },
  ],
  CONTAINMENT_PENDING: [
    {
      status: "INVESTIGATING",
      label: "Return to investigation",
      permission: INCIDENT_CASE_PERMISSIONS.INVESTIGATE,
      highImpact: false,
    },
    {
      status: "RESOLVED",
      label: "Resolve case",
      permission: INCIDENT_CASE_PERMISSIONS.RESOLVE,
      highImpact: true,
    },
  ],
  RESOLVED: [
    {
      status: "CLOSED",
      label: "Close case",
      permission: INCIDENT_CASE_PERMISSIONS.CLOSE,
      highImpact: true,
    },
    {
      status: "REOPENED",
      label: "Reopen case",
      permission: INCIDENT_CASE_PERMISSIONS.REOPEN,
      highImpact: true,
    },
  ],
  CLOSED: [
    {
      status: "REOPENED",
      label: "Reopen case",
      permission: INCIDENT_CASE_PERMISSIONS.REOPEN,
      highImpact: true,
    },
  ],
  REOPENED: [
    {
      status: "TRIAGED",
      label: "Return to triage",
      permission: INCIDENT_CASE_PERMISSIONS.TRIAGE,
      highImpact: false,
    },
    {
      status: "INVESTIGATING",
      label: "Resume investigation",
      permission: INCIDENT_CASE_PERMISSIONS.INVESTIGATE,
      highImpact: false,
    },
  ],
};

const SENSITIVE_INPUT =
  /(?:password|passwd|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|client[_ -]?secret|database[_ -]?url|connection[_ -]?string|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i;

export function containsSensitiveInput(value: string): boolean {
  return SENSITIVE_INPUT.test(value);
}

export function hasPermission(
  activePermissions: readonly string[],
  permission: string,
): boolean {
  return activePermissions.includes(permission);
}

export function formatCaseDate(value: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

export function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function linkedEventReference(value: string | null): string {
  if (!value) return "Not linked";
  const suffix = value.slice(-8);
  return `Linked event ••••${suffix}`;
}

export function abbreviatedHash(value: string): string {
  return value.length > 16
    ? `${value.slice(0, 8)}…${value.slice(-8)}`
    : value;
}

export function safeCaseErrorMessage(status: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You are not authorized to perform this case operation.";
  if (status === 404) return "The requested case resource was not found.";
  if (status === 409) {
    return "The case changed before this operation completed. The latest state has been loaded.";
  }
  if (status >= 500) {
    return "Case management is temporarily unavailable. Please try again.";
  }
  return "The request could not be completed. Review the fields and try again.";
}

export function createIdempotencyKey(prefix: string): string {
  const random =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}:${random}`;
}
