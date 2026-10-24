/**
 * RENTipid GLCC v1.0.1 — Domain Contract: trustSafety
 */

export const TRUSTSAFETY_KEYS = [
  "trustSafety.builtOnTrustSafety",
  "trustSafety.weTakeSecuritySeriously",
  "trustSafety.verifiedCommunity",
  "trustSafety.everyUserUndergoesThorough",
  "trustSafety.secureEscrow",
  "trustSafety.paymentsAreHeldSecurely",
  "trustSafety.247Support",
  "trustSafety.ourDedicatedResolutionCenter",
  "trustSafety.readyToGetStarted",
  "trustSafety.trustSafetyCenter",
  "trustSafety.identityVerificationKyc",
  "trustSafety.allUsersMustVerify",
  "trustSafety.securePayments",
  "trustSafety.neverPayOutsideThe"
] as const;

export const TRUSTSAFETY_EN_PH: Record<(typeof TRUSTSAFETY_KEYS)[number], string> = {
  "trustSafety.builtOnTrustSafety": "Built on Trust & Safety",
  "trustSafety.weTakeSecuritySeriously": "We take security seriously. Every transaction is protected by our comprehensive safety framework.",
  "trustSafety.verifiedCommunity": "Verified Community",
  "trustSafety.everyUserUndergoesThorough": "Every user undergoes thorough identity verification (KYC) before they can transact on the platform.",
  "trustSafety.secureEscrow": "Secure Escrow",
  "trustSafety.paymentsAreHeldSecurely": "Payments are held securely in escrow and only released when the rental is successfully completed.",
  "trustSafety.247Support": "24/7 Support",
  "trustSafety.ourDedicatedResolutionCenter": "Our dedicated resolution center and support team are always ready to help mediate any disputes.",
  "trustSafety.readyToGetStarted": "Ready to get started?",
  "trustSafety.trustSafetyCenter": "Trust & Safety Center",
  "trustSafety.identityVerificationKyc": "Identity Verification (KYC)",
  "trustSafety.allUsersMustVerify": "All users must verify their identity before transacting on the platform.",
  "trustSafety.securePayments": "Secure Payments",
  "trustSafety.neverPayOutsideThe": "Never pay outside the RENTipid platform. All transactions are protected by our Escrow system."
};
