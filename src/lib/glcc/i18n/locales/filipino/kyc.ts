/**
 * RENTipid GLCC v1.0.1 — Filipino Domain Bundle: kyc
 */

import { KYC_KEYS } from '../../contracts/kyc';

export const KYC_FIL_PH: Record<(typeof KYC_KEYS)[number], string> = {
  "kyc.accountVerificationKyc": "Beripikasyon ng Account (KYC)",
  "kyc.submitRequiredDocumentsTo": "Isumite ang mga kinakailangang dokumento upang magamit ang lahat ng feature ng plataporma.",
  "kyc.uploadDocument": "Mag-upload ng Dokumento",
  "kyc.selectDocumentType": "Pumili ng uri ng dokumento...",
  "kyc.validGovernmentId": "Balidong ID ng Gobyerno",
  "kyc.selfieVerification": "Beripikasyon sa Selfie",
  "kyc.proofOfAddress": "Katibayan ng Address",
  "kyc.businessPermitRegistration": "Permiso / Rehistro sa Negosyo",
  "kyc.proofOfOwnershipAuthorization": "Katibayan ng Pagmamay-ari / Awtorisasyon",
  "kyc.file": "File",
  "kyc.maxSize5mbFormats": "Pinakamalaking sukat: 5MB. Mga format: PDF, JPG, PNG, WEBP.",
  "kyc.myUploadedDocuments": "Aking mga Na-upload na Dokumento",
  "kyc.requiredDocuments": "Mga Kinakailangang Dokumento",
  "kyc.documentType": "Uri ng Dokumento",
  "kyc.noDocumentsUploadedYet": "Wala pang na-upload na mga dokumento.",
};
