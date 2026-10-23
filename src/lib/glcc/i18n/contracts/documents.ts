/**
 * RENTipid GLCC v1.0.1 — Domain Contract: documents
 */

export const DOCUMENTS_KEYS = [
  "documentUploader.uploadedOn",
  "documentUploader.empty",
  "documentUploader.docTypeLabel",
  "documentUploader.types.proofOfOwnership",
  "documentUploader.types.vehicleRegistration",
  "documentUploader.types.businessPermit",
  "documentUploader.types.insurancePolicy",
  "documentUploader.types.safetyCertificate",
  "documentUploader.selectFile",
  "documentUploader.uploading",
  "documentUploader.formatHelp",
  "documentUploader.errorFailed",
  "documentUploader.errorGeneric",
  "documentUploader.status.approved",
  "documentUploader.status.rejected",
  "documentUploader.status.pending"
] as const;

export const DOCUMENTS_EN_PH: Record<(typeof DOCUMENTS_KEYS)[number], string> = {
  "documentUploader.uploadedOn": "Uploaded on {date}",
  "documentUploader.empty": "No documents uploaded yet.",
  "documentUploader.docTypeLabel": "Document Type",
  "documentUploader.types.proofOfOwnership": "Proof of Ownership",
  "documentUploader.types.vehicleRegistration": "Vehicle Registration (OR/CR)",
  "documentUploader.types.businessPermit": "Business Permit",
  "documentUploader.types.insurancePolicy": "Insurance Policy",
  "documentUploader.types.safetyCertificate": "Safety Certificate",
  "documentUploader.selectFile": "Select File & Upload",
  "documentUploader.uploading": "Uploading...",
  "documentUploader.formatHelp": "PDF, JPG, PNG up to 10MB",
  "documentUploader.errorFailed": "Upload failed",
  "documentUploader.errorGeneric": "An error occurred during upload",
  "documentUploader.status.approved": "Approved",
  "documentUploader.status.rejected": "Rejected",
  "documentUploader.status.pending": "Pending"
};
