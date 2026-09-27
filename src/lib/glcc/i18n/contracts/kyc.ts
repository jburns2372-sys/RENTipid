/**
 * RENTipid GLCC v1.0.1 — Domain Contract: kyc
 */

export const KYC_KEYS = [
  "kyc.accountVerificationKyc",
  "kyc.submitRequiredDocumentsTo",
  "kyc.uploadDocument",
  "kyc.selectDocumentType",
  "kyc.validGovernmentId",
  "kyc.selfieVerification",
  "kyc.proofOfAddress",
  "kyc.businessPermitRegistration",
  "kyc.proofOfOwnershipAuthorization",
  "kyc.file",
  "kyc.maxSize5mbFormats",
  "kyc.myUploadedDocuments"
] as const;

export const KYC_EN_PH: Record<(typeof KYC_KEYS)[number], string> = {
  "kyc.accountVerificationKyc": "Account Verification (KYC)",
  "kyc.submitRequiredDocumentsTo": "Submit required documents to unlock full platform features.",
  "kyc.uploadDocument": "Upload Document",
  "kyc.selectDocumentType": "Select document type...",
  "kyc.validGovernmentId": "Valid Government ID",
  "kyc.selfieVerification": "Selfie Verification",
  "kyc.proofOfAddress": "Proof of Address",
  "kyc.businessPermitRegistration": "Business Permit / Registration",
  "kyc.proofOfOwnershipAuthorization": "Proof of Ownership / Authorization",
  "kyc.file": "File",
  "kyc.maxSize5mbFormats": "Max size: 5MB. Formats: PDF, JPG, PNG, WEBP.",
  "kyc.myUploadedDocuments": "My Uploaded Documents"
};
