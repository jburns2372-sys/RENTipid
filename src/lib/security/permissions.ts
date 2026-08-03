

export const SECURITY_PERMISSIONS = {
  // Phase 1 Foundations
  DASHBOARD_VIEW: "security.dashboard.view",
  TECHNICAL_DETAILS_VIEW: "security.technical_details.view",
  
  // Future Phases (Defined in vocabulary, but inactive or restricted in Phase 1)
  EVENTS_VIEW: "security.events.view",
  EVENTS_EXPORT: "security.events.export",
  INCIDENTS_VIEW: "security.incidents.view",
  INCIDENTS_ASSIGN: "security.incidents.assign",
  INCIDENTS_UPDATE: "security.incidents.update",
  INCIDENTS_CLOSE: "security.incidents.close",
  INCIDENT_CASE_VIEW: "security.incident_cases.view",
  INCIDENT_CASE_CREATE: "security.incident_cases.create",
  INCIDENT_CASE_TRIAGE: "security.incident_cases.triage",
  INCIDENT_CASE_INVESTIGATE: "security.incident_cases.investigate",
  INCIDENT_CASE_ASSIGN: "security.incident_cases.assign",
  INCIDENT_CASE_REASSIGN: "security.incident_cases.reassign",
  INCIDENT_CASE_ADD_NOTE: "security.incident_cases.add_note",
  INCIDENT_CASE_ADD_EVIDENCE: "security.incident_cases.add_evidence",
  INCIDENT_CASE_REQUEST_CONTAINMENT: "security.incident_cases.request_containment",
  INCIDENT_CASE_RESOLVE: "security.incident_cases.resolve",
  INCIDENT_CASE_CLOSE: "security.incident_cases.close",
  INCIDENT_CASE_REOPEN: "security.incident_cases.reopen",
  INCIDENT_CASE_ESCALATE: "security.incident_cases.escalate",
  COUNTERMEASURES_EXECUTE: "security.countermeasures.execute",
  COUNTERMEASURES_ROLLBACK: "security.countermeasures.rollback",

  // Gate 4G Playbook Lifecycle
  PLAYBOOK_VIEW: "security.playbooks.view",
  PLAYBOOK_CREATE: "security.playbooks.create",
  PLAYBOOK_EDIT: "security.playbooks.edit",
  PLAYBOOK_VERSION_CREATE: "security.playbooks.version_create",
  PLAYBOOK_SUBMIT_REVIEW: "security.playbooks.submit_review",
  PLAYBOOK_REVIEW: "security.playbooks.review",
  PLAYBOOK_APPROVE: "security.playbooks.approve",
  PLAYBOOK_REJECT: "security.playbooks.reject",
  PLAYBOOK_ACTIVATE: "security.playbooks.activate",
  RESPONSE_VIEW: "security.response.view",
  RESPONSE_REQUEST: "security.response.request",
  RESPONSE_APPROVE: "security.response.approve",
  RESPONSE_REJECT: "security.response.reject",
  RESPONSE_CANCEL: "security.response.cancel",
  RESPONSE_REVOKE: "security.response.revoke",
  RESPONSE_EXECUTE: "security.response.execute",
  RESPONSE_ROLLBACK: "security.response.rollback",

  RULES_VIEW: "security.rules.view",
  RULES_MANAGE: "security.rules.manage", // Unused, keeping for compatibility
  RULES_CREATE: "security.rules.create",
  RULES_INITIALIZE: "security.rules.initialize",
  RULES_UPDATE: "security.rules.update",
  RULES_ACTIVATE: "security.rules.activate",
  RULES_ARCHIVE: "security.rules.archive",
  SIMULATIONS_RUN: "security.simulations.run",
  EVIDENCE_VIEW: "security.evidence.view",
  REPORTS_EXPORT: "security.reports.export",
  ALERTS_VIEW: "security.alerts.view",

  // Compliance & Prohibited Items
  PROHIBITED_ITEMS_REVIEW_LISTING: "compliance.prohibited_items.review",
  PROHIBITED_ITEMS_MANAGE_POLICY: "compliance.prohibited_items.manage_policy",
  PROHIBITED_ITEMS_MANAGE_APPEAL: "compliance.prohibited_items.manage_appeal",
  ALERTS_REVIEW: "security.alerts.review",
  EMERGENCY_ACTIVATE: "security.emergency.activate",
  FINANCE_REVIEW: "security.finance.review",
  COMPLIANCE_REVIEW: "security.compliance.review",
  
  // Prohibited Items Module
  PROHIBITED_ITEMS_REVIEW_LISTING: "prohibited_items.review_listing",
  PROHIBITED_ITEMS_TAKE_DOWN_LISTING: "prohibited_items.take_down_listing",
  PROHIBITED_ITEMS_MANAGE_POLICY: "prohibited_items.manage_policy",
  PROHIBITED_ITEMS_MANAGE_APPEAL: "prohibited_items.manage_appeal",
  PROHIBITED_ITEMS_VIEW_SENSITIVE_EVIDENCE: "prohibited_items.view_sensitive_evidence",
  PROHIBITED_ITEMS_APPROVE_POLICY_CHANGE: "prohibited_items.approve_policy_change",
} as const;

export type SecurityPermission = typeof SECURITY_PERMISSIONS[keyof typeof SECURITY_PERMISSIONS];

export type UserRole = 
  | "Guest" 
  | "Renter" 
  | "Individual Provider" 
  | "Business Provider" 
  | "Admin" 
  | "Finance Admin" 
  | "Compliance Admin" 
  | "SOC_ANALYST"
  | "SOC_SUPERVISOR"
  | "Super Admin";

export const SOC_ANALYST_CASE_PERMISSIONS: readonly SecurityPermission[] = [
  SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW,
  SECURITY_PERMISSIONS.INCIDENT_CASE_CREATE,
  SECURITY_PERMISSIONS.INCIDENT_CASE_TRIAGE,
  SECURITY_PERMISSIONS.INCIDENT_CASE_INVESTIGATE,
  SECURITY_PERMISSIONS.INCIDENT_CASE_ADD_NOTE,
  SECURITY_PERMISSIONS.INCIDENT_CASE_ADD_EVIDENCE,
];

export const SOC_SUPERVISOR_CASE_PERMISSIONS: readonly SecurityPermission[] = [
  ...SOC_ANALYST_CASE_PERMISSIONS,
  SECURITY_PERMISSIONS.INCIDENT_CASE_ASSIGN,
  SECURITY_PERMISSIONS.INCIDENT_CASE_REASSIGN,
  SECURITY_PERMISSIONS.INCIDENT_CASE_REQUEST_CONTAINMENT,
  SECURITY_PERMISSIONS.INCIDENT_CASE_RESOLVE,
  SECURITY_PERMISSIONS.INCIDENT_CASE_CLOSE,
  SECURITY_PERMISSIONS.INCIDENT_CASE_REOPEN,
  SECURITY_PERMISSIONS.INCIDENT_CASE_ESCALATE,
];

export const SOC_PLAYBOOK_PERMISSIONS: readonly SecurityPermission[] = [
  SECURITY_PERMISSIONS.PLAYBOOK_VIEW,
  SECURITY_PERMISSIONS.PLAYBOOK_CREATE,
  SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
  SECURITY_PERMISSIONS.PLAYBOOK_VERSION_CREATE,
  SECURITY_PERMISSIONS.PLAYBOOK_SUBMIT_REVIEW,
  SECURITY_PERMISSIONS.PLAYBOOK_REVIEW,
  SECURITY_PERMISSIONS.PLAYBOOK_APPROVE,
  SECURITY_PERMISSIONS.PLAYBOOK_REJECT,
  SECURITY_PERMISSIONS.PLAYBOOK_ACTIVATE,
];

export const SOC_RESPONSE_PERMISSIONS: readonly SecurityPermission[] = [
  SECURITY_PERMISSIONS.RESPONSE_REQUEST,
  SECURITY_PERMISSIONS.RESPONSE_APPROVE,
  SECURITY_PERMISSIONS.RESPONSE_REJECT,
  SECURITY_PERMISSIONS.RESPONSE_CANCEL,
  SECURITY_PERMISSIONS.RESPONSE_REVOKE,
  SECURITY_PERMISSIONS.RESPONSE_EXECUTE,
];

/**
 * Returns the currently active Phase 1 permissions for a given verified role.
 * Unimplemented phase permissions are omitted even if they exist in the vocabulary.
 */
export function getPhase1PermissionsForRole(role: string): SecurityPermission[] {
  switch (role as UserRole) {
    case "Super Admin":
      return [
        SECURITY_PERMISSIONS.DASHBOARD_VIEW,
        SECURITY_PERMISSIONS.TECHNICAL_DETAILS_VIEW,
        SECURITY_PERMISSIONS.EVENTS_VIEW,
        SECURITY_PERMISSIONS.RULES_VIEW,
        SECURITY_PERMISSIONS.RULES_CREATE,
        SECURITY_PERMISSIONS.RULES_INITIALIZE,
        SECURITY_PERMISSIONS.RULES_UPDATE,
        SECURITY_PERMISSIONS.RULES_ACTIVATE,
        SECURITY_PERMISSIONS.RULES_ARCHIVE,
        SECURITY_PERMISSIONS.ALERTS_VIEW,
        SECURITY_PERMISSIONS.ALERTS_REVIEW,
        ...SOC_SUPERVISOR_CASE_PERMISSIONS,
        ...SOC_PLAYBOOK_PERMISSIONS,
        ...SOC_RESPONSE_PERMISSIONS,
        SECURITY_PERMISSIONS.RESPONSE_VIEW,
        SECURITY_PERMISSIONS.RESPONSE_ROLLBACK,
        SECURITY_PERMISSIONS.SIMULATIONS_RUN,
        SECURITY_PERMISSIONS.REPORTS_EXPORT,
        
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_REVIEW_LISTING,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_TAKE_DOWN_LISTING,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_MANAGE_POLICY,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_MANAGE_APPEAL,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_VIEW_SENSITIVE_EVIDENCE,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_APPROVE_POLICY_CHANGE,
      ];
    case "SOC_ANALYST":
      return [
        SECURITY_PERMISSIONS.DASHBOARD_VIEW,
        ...SOC_ANALYST_CASE_PERMISSIONS,
        SECURITY_PERMISSIONS.PLAYBOOK_VIEW,
        SECURITY_PERMISSIONS.PLAYBOOK_CREATE,
        SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
        SECURITY_PERMISSIONS.PLAYBOOK_VERSION_CREATE,
        SECURITY_PERMISSIONS.PLAYBOOK_SUBMIT_REVIEW,
        SECURITY_PERMISSIONS.RESPONSE_VIEW,
        SECURITY_PERMISSIONS.RESPONSE_REQUEST,
        SECURITY_PERMISSIONS.RESPONSE_CANCEL,
      ];
    case "SOC_SUPERVISOR":
      return [
        ...SOC_SUPERVISOR_CASE_PERMISSIONS,
        ...SOC_PLAYBOOK_PERMISSIONS,
        ...SOC_RESPONSE_PERMISSIONS,
        SECURITY_PERMISSIONS.RESPONSE_VIEW,
      ];
    case "Compliance Admin":
      return [
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_REVIEW_LISTING,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_TAKE_DOWN_LISTING,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_MANAGE_POLICY,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_MANAGE_APPEAL,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_VIEW_SENSITIVE_EVIDENCE,
        SECURITY_PERMISSIONS.PROHIBITED_ITEMS_APPROVE_POLICY_CHANGE,
      ];
    case "Admin":
    case "Finance Admin":
    case "Guest":
    case "Renter":
    case "Individual Provider":
    case "Business Provider":
    default:
      return [];
  }
}
