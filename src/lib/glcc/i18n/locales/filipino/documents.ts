/**
 * RENTipid GLCC v1.0.1 — Filipino Domain Bundle: documents
 */

import { DOCUMENTS_KEYS } from '../../contracts/documents';

export const DOCUMENTS_FIL_PH: Record<(typeof DOCUMENTS_KEYS)[number], string> = {
  "documentUploader.uploadedOn": "Na-upload noong {date}",
  "documentUploader.empty": "Wala pang na-upload na dokumento.",
  "documentUploader.docTypeLabel": "Uri ng Dokumento",
  "documentUploader.types.proofOfOwnership": "Katibayan ng Pagmamay-ari",
  "documentUploader.types.vehicleRegistration": "Rehistro ng Sasakyan (OR/CR)",
  "documentUploader.types.businessPermit": "Permit ng Negosyo",
  "documentUploader.types.insurancePolicy": "Polisiya ng Seguro",
  "documentUploader.types.safetyCertificate": "Sertipiko ng Kaligtasan",
  "documentUploader.selectFile": "Pumili ng File at I-upload",
  "documentUploader.uploading": "Nag-a-upload...",
  "documentUploader.formatHelp": "PDF, JPG, PNG hanggang 10MB",
  "documentUploader.errorFailed": "Nabigo ang pag-upload",
  "documentUploader.errorGeneric": "Nagkaroon ng error habang nag-a-upload",
  "documentUploader.status.approved": "Inaprubahan",
  "documentUploader.status.rejected": "Tinanggihan",
  "documentUploader.status.pending": "Nakabinbin",
};
