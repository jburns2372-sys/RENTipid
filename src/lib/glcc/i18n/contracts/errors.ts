/**
 * RENTipid GLCC v1.0.1 — Domain Contract: errors
 */

export const ERRORS_KEYS = [
  "errors.general.title",
  "errors.unauthorized.title",
  "errors.unauthorized.description",
  "errors.unauthorized.returnHome"
] as const;

export const ERRORS_EN_PH: Record<(typeof ERRORS_KEYS)[number], string> = {
  "errors.general.title": "Errors",
  "errors.unauthorized.title": "Access Denied",
  "errors.unauthorized.description": "You do not have permission to access this page. Please ensure you are logged into the correct account or contact support if you believe this is an error.",
  "errors.unauthorized.returnHome": "Return to Home"
};
