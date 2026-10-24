/**
 * RENTipid GLCC v1.0.1 — Domain Contract: account
 */

export const ACCOUNT_KEYS = [
  "account.profile.title",
  "account.profile.basicInfo",
  "account.profile.fullNameLabel",
  "account.profile.emailLabel",
  "account.profile.roleLabel",
  "account.profile.statusLabel",
  "account.profile.deleteAccount",
  "account.preferences.title",
  "account.preferences.description",
  "account.preferences.editButton",
  "account.preferences.editAriaLabel",
  "account.preferences.manualOverride",
  "account.preferences.standardDefault",
  "account.preferences.regionCode",
  "account.requestReceived",
  "account.warningThisActionIs",
  "account.reasonForDeletion",
  "account.iUnderstandThatThis",
  "account.pleaseLetUsKnow",
  "account.activeSessions",
  "account.reviewWhereYourAccount",
  "account.noActiveSessionsFound",
  "account.refreshSessions"
] as const;

export const ACCOUNT_EN_PH: Record<(typeof ACCOUNT_KEYS)[number], string> = {
  "account.profile.title": "My Profile",
  "account.profile.basicInfo": "Basic Information",
  "account.profile.fullNameLabel": "Full Name / Business Name",
  "account.profile.emailLabel": "Email Address",
  "account.profile.roleLabel": "Account Role",
  "account.profile.statusLabel": "Verification Status",
  "account.profile.deleteAccount": "Delete Account",
  "account.preferences.title": "Regional & Language Preferences",
  "account.preferences.description": "Configure your preferred browsing language, country, and display currency.",
  "account.preferences.editButton": "Edit Preferences",
  "account.preferences.editAriaLabel": "Edit global preferences",
  "account.preferences.manualOverride": "Manual selection",
  "account.preferences.standardDefault": "Standard regional default",
  "account.preferences.regionCode": "Region code: {code}",
  "account.requestReceived": "Request Received",
  "account.warningThisActionIs": "Warning: This action is permanent.",
  "account.reasonForDeletion": "Reason for Deletion",
  "account.iUnderstandThatThis": "I understand that this action cannot be undone.",
  "account.pleaseLetUsKnow": "Please let us know why you",
  "account.activeSessions": "Active sessions",
  "account.reviewWhereYourAccount": "Review where your account is signed in.",
  "account.noActiveSessionsFound": "No active sessions found.",
  "account.refreshSessions": "Refresh sessions"
};
