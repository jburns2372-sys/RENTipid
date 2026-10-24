import type { InsuranceBookingContextSource } from "./booking-context";
import { toInsuranceEligibilityContext } from "./booking-context";
import { createInsuranceTransactionRuntime } from "./runtime";

export type OptionalInsuranceCheckoutResult =
  | { status: "NOT_SELECTED" }
  | { status: "SELECTION_RECORDED"; selectionId: string; orderId: string }
  | { status: "SKIPPED"; safeCode: string };

export async function processOptionalInsuranceCheckout(input: {
  formData: FormData;
  booking: InsuranceBookingContextSource;
  userId: string;
  checkoutRequestId: string;
}): Promise<OptionalInsuranceCheckoutResult> {
  if (input.formData.get("insurance_selected") !== "true") {
    return { status: "NOT_SELECTED" };
  }
  if (input.formData.get("insurance_consent") !== "true") {
    return { status: "SKIPPED", safeCode: "AFFIRMATIVE_CONSENT_REQUIRED" };
  }

  const offerId = input.formData.get("insurance_offer_id");
  const disclosureVersion = input.formData.get("insurance_disclosure_version");
  const premiumMinorRaw = input.formData.get("insurance_premium_minor");
  const currency = input.formData.get("insurance_currency");
  if (
    typeof offerId !== "string" ||
    typeof disclosureVersion !== "string" ||
    typeof premiumMinorRaw !== "string" ||
    typeof currency !== "string"
  ) {
    return { status: "SKIPPED", safeCode: "INVALID_INSURANCE_SELECTION" };
  }
  const premiumMinor = Number(premiumMinorRaw);
  if (!Number.isSafeInteger(premiumMinor) || premiumMinor < 0) {
    return { status: "SKIPPED", safeCode: "INVALID_INSURANCE_PREMIUM" };
  }

  try {
    const service = createInsuranceTransactionRuntime();
    const context = toInsuranceEligibilityContext(
      input.booking,
      input.checkoutRequestId,
    );
    const selection = await service.selectOffer({
      requestId: input.checkoutRequestId,
      userId: input.userId,
      bookingId: input.booking.id,
      eligibilityContext: context,
      offerId,
      consent: {
        accepted: true,
        disclosureVersion,
        consentedAt: new Date(),
        premiumPresentedMinor: premiumMinor,
        currency,
      },
    });
    const order = await service.createOrder(
      selection.id,
      input.userId,
      input.checkoutRequestId,
    );
    return {
      status: "SELECTION_RECORDED",
      selectionId: selection.id,
      orderId: order.id,
    };
  } catch {
    // Insurance is optional; a safe Insurance failure must not block rental payment.
    return { status: "SKIPPED", safeCode: "INSURANCE_UNAVAILABLE" };
  }
}
