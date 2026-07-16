import "server-only";

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
  COUNTERMEASURES_EXECUTE: "security.countermeasures.execute",
  COUNTERMEASURES_ROLLBACK: "security.countermeasures.rollback",
  RULES_VIEW: "security.rules.view",
  RULES_MANAGE: "security.rules.manage",
  SIMULATIONS_RUN: "security.simulations.run",
  EVIDENCE_VIEW: "security.evidence.view",
  REPORTS_EXPORT: "security.reports.export",
  EMERGENCY_ACTIVATE: "security.emergency.activate",
  FINANCE_REVIEW: "security.finance.review",
  COMPLIANCE_REVIEW: "security.compliance.review",
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
  | "Super Admin";

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
      ];
    case "Admin":
      return [];
    case "Finance Admin":
    case "Compliance Admin":
    case "Guest":
    case "Renter":
    case "Individual Provider":
    case "Business Provider":
    default:
      return [];
  }
}
