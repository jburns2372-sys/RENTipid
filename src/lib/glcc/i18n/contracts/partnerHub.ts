/**
 * RENTipid GLCC v1.0.1 — Domain Contract: partnerHub
 */

export const PARTNERHUB_KEYS = [
  "partnerHub.businessDashboard",
  "partnerHub.completeYourBusinessVerification",
  "partnerHub.submitYourBusinessPermit",
  "partnerHub.businessListings",
  "partnerHub.listingFunctionalityPendingPhase",
  "partnerHub.businessEarnings",
  "partnerHub.earningsDashboardPendingPhase",
  "partnerHub.registerYourBusiness",
  "partnerHub.listYourCompanyS",
  "partnerHub.businessInformation",
  "partnerHub.businessName",
  "partnerHub.businessRegistrationNumberDti",
  "partnerHub.businessAddress",
  "partnerHub.authorizedRepresentativeLogin",
  "partnerHub.representativeFullName",
  "partnerHub.businessEmail",
  "partnerHub.termsAndConditions",
  "partnerHub.and"
] as const;

export const PARTNERHUB_EN_PH: Record<(typeof PARTNERHUB_KEYS)[number], string> = {
  "partnerHub.businessDashboard": "Business Dashboard",
  "partnerHub.completeYourBusinessVerification": "Complete your business verification",
  "partnerHub.submitYourBusinessPermit": "Submit your Business Permit and valid ID to activate your business profile.",
  "partnerHub.businessListings": "Business Listings",
  "partnerHub.listingFunctionalityPendingPhase": "Listing functionality pending Phase 3",
  "partnerHub.businessEarnings": "Business Earnings",
  "partnerHub.earningsDashboardPendingPhase": "Earnings dashboard pending Phase 3",
  "partnerHub.registerYourBusiness": "Register Your Business",
  "partnerHub.listYourCompanyS": "List your company's assets, properties, or fleet on RENTipid.",
  "partnerHub.businessInformation": "Business Information",
  "partnerHub.businessName": "Business Name *",
  "partnerHub.businessRegistrationNumberDti": "Business Registration Number (DTI/SEC/Permit) *",
  "partnerHub.businessAddress": "Business Address *",
  "partnerHub.authorizedRepresentativeLogin": "Authorized Representative & Login",
  "partnerHub.representativeFullName": "Representative Full Name *",
  "partnerHub.businessEmail": "Business Email *",
  "partnerHub.termsAndConditions": "Terms and Conditions",
  "partnerHub.and": "and"
};
