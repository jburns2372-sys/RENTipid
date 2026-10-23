import type { GlobalBookingRecord } from '../../../src/lib/global-market/booking/contracts/booking-record';
import { createEligiblePayoutContext } from '../../../src/lib/global-market/booking/services/booking-service';
import type { PaymentAttemptRecord } from '../../../src/lib/global-market/financial/contracts/payment-record';
import type { CreatePayoutInstructionInput } from '../../../src/lib/global-market/financial/services/payout-orchestrator';
import type { XenditPayoutConfig, XenditPayoutBeneficiary, XenditPayoutAuthority } from '../../../src/lib/global-market/financial/adapters/xendit-payout-adapter';

export function payoutBooking(id: string,country = 'TH',currency = 'THB'): GlobalBookingRecord {
  const now = '2026-10-01T00:00:00.000Z';
  return { id,bookingReference:id,participants:{ renterId:'renter',providerId:'owner',listingId:'listing',jurisdictionCode:country },
    listingSnapshot:{ listingId:'listing',providerId:'owner',jurisdictionCode:country,title:'Test',pricingUnit:'DAILY',basePriceMinorUnits:50000,
      currency,securityDepositMinorUnits:10000,snapshotTimestamp:now },
    moneySnapshot:{ listingPriceCurrency:currency,bookingPriceCurrency:currency,displayCurrency:'USD',baseRentalAmountMinorUnits:50000,
      securityDepositAmountMinorUnits:10000,deliveryFeeMinorUnits:0,platformFeeMinorUnits:0,estimatedTotalAmountMinorUnits:60000,
      isFxGuaranteed:false,transactionCurrencyRequired:currency,settlementCurrencyRequired:currency,snapshotTimestamp:now },
    rentalPeriod:{ startDate:'2026-10-01',endDate:'2026-10-02',duration:1,durationUnit:'DAILY',jurisdictionTimezone:'UTC',startUtcTimestamp:now,endUtcTimestamp:'2026-10-02T00:00:00.000Z' },
    status:'COMPLETED',paymentStatus:'SETTLED',createdAt:now,updatedAt:now };
}
export function payoutPayment(booking: GlobalBookingRecord): PaymentAttemptRecord {
  return { id:`pay-${booking.id}`,bookingId:booking.id,payerId:'renter',providerId:'owner',jurisdictionCode:booking.participants.jurisdictionCode,
    authoritativeAmountMinorUnits:60000,depositAmountMinorUnits:10000,deliveryFeeMinorUnits:0,transactionCurrency:booking.moneySnapshot.transactionCurrencyRequired,
    paymentProviderId:'xendit',idempotencyKey:`pay-${booking.id}`,providerReference:`ps-${booking.id}`,normalizedStatus:'SUCCEEDED',reconciliationStatus:'MATCHED',createdAt:booking.createdAt,updatedAt:booking.updatedAt };
}
export function payoutRequest(id: string,country = 'TH',currency = 'THB'): CreatePayoutInstructionInput {
  const booking = payoutBooking(id,country,currency);
  return { booking,paymentRecord:payoutPayment(booking),eligibleContext:createEligiblePayoutContext(booking),providerKycApproved:true,
    authoritativeBeneficiaryReference:'beneficiary-owner',idempotencyKey:`key-${id}` };
}
export function payoutBeneficiary(country = 'TH',currency = 'THB'): XenditPayoutBeneficiary {
  return { providerId:'owner',reference:'beneficiary-owner',jurisdictionCode:country,currency,accountType:'BANK',verified:true,
    recipient:{ type:'INDIVIDUAL',given_name:'Private',surname:'Beneficiary',relationship:'SUPPLIER',address:{ country,city:'Sandbox',street_line_1:'Test only' },
      account_details:{ currency,account_country:country,account_holder_name:'Private Beneficiary',account_number:'123456789012',routing_type_1:'SWIFT',routing_value_1:'TESTXXXX' } } };
}
export function payoutAuthority(id: string,country = 'TH',currency = 'THB'): XenditPayoutAuthority {
  return { bookingId:id,providerId:'owner',jurisdictionCode:country,beneficiaryReference:'beneficiary-owner',amountMinorUnits:50000,currency,
    authorityReference:`server-authority-${id}`,bookingCompleted:true,paymentSucceeded:true,paymentReconciled:true,providerKycApproved:true,
    hasActiveClaim:false,hasActiveDispute:false,isHeld:false };
}
export function payoutConfig(statePath: string,country = 'TH',currency = 'THB'): XenditPayoutConfig {
  return { secretKey:'xnd_development_payout_testonly',webhookToken:'payout_testonly_callback',businessId:'payouttestbusiness',environment:'sandbox',statePath,
    resolveBeneficiary:async () => payoutBeneficiary(country,currency),resolvePayoutAuthority:async id => payoutAuthority(id,country,currency) };
}
export function providerPayout(body: Record<string,any>,status = 'ACCEPTED'): Record<string,any> {
  return { payout_id:'po-testonly',reference_id:body.reference_id,status,business_id:'payouttestbusiness',recipient:body.recipient,
    source_currency:body.payout_details.source_currency,destination_currency:body.payout_details.destination_currency,
    source_amount:body.payout_details.destination_amount,destination_amount:body.payout_details.destination_amount };
}
