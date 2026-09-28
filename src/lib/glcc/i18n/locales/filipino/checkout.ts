/**
 * RENTipid GLCC v1.0.1 — Filipino Domain Bundle: checkout
 */

import { CHECKOUT_KEYS } from '../../contracts/checkout';

export const CHECKOUT_FIL_PH: Record<(typeof CHECKOUT_KEYS)[number], string> = {
  "checkout.searchparamsPromise": ", searchParams: Promise",
  "checkout.invalidCheckoutState": "Di-wastong Katayuan ng Checkout",
  "checkout.thisBookingCannotBe": "Hindi maaaring bayaran ang booking na ito sa ngayon.",
  "checkout.agreementRequired": "Kinakailangan ang Kasunduan",
  "checkout.youMustAcceptThe": "Dapat mong tanggapin ang kasunduan sa pag-upa bago magbayad.",
  "checkout.accessDenied": "Tinanggihan ang Pag-access",
  "checkout.youAreNotOn": "Wala ka sa pinapayagang whitelist para sa live payment pilot.",
  "checkout.secureCheckout": "Ligtas na Pag-checkout",
  "checkout.paymentMethod": "Paraan ng Pagbabayad",
  "checkout.livePaymentMethodsAre": "Ang mga live na paraan ng pagbabayad ay hindi pa available.",
  "checkout.paymongoActivationIsPending": "Nakabinbin ang pag-activate ng PayMongo. Mangyaring makipag-ugnayan sa admin o gumamit ng mock/sandbox mode hanggang sa makumpleto ang pag-activate.",
  "checkout.livePaymentIsCurrently": "Ang live na pagbabayad ay kasalukuyang naka-freeze ng Super Admin.",
  "checkout.allRealTransactionsAre": "Ang lahat ng totoong transaksyon ay mahigpit na itinigil. Mangyaring makipag-ugnayan sa suporta.",
  "checkout.limitedLivePilotEnabled": "🚨 LIMITADONG LIVE PILOT AY PINAGANA:",
  "checkout.sandboxPaymentModeActive": "Aktibo ang Sandbox Payment Mode:",
  "checkout.phase5Note": "Paalala sa Yugto 5:",
  "checkout.selectPermittedPilotPayment": "Pumili ng Pinapayagang Paraan ng Pagbabayad sa Pilot",
  "checkout.chooseMethod": "-- Pumili ng Paraan --",
  "checkout.creditCard": "Credit Card",
  "checkout.onlyStandardGcashOr": "Tanging karaniwang GCash o karaniwang mga credit card lamang ang pinapayagan para sa pilot upang mabawasan ang mga panganib ng chargeback.",
  "checkout.orderSummary": "Buod ng Order",
  "checkout.securityDepositEscrow": "Seguridad na Deposito (Escrow)",
  "checkout.total": "Kabuuan",
  "checkout.authoritativePaymentCurrency": "May Kapangyarihang Pananalapi sa Pagbabayad",
  "checkout.phpPhilippinePeso": "PHP (Philippine Peso)",
  "checkout.finalAmount": ". Huling halaga:",
  "checkout.important": "Mahalaga:",
  "checkout.authoritativeCharge": "May Kapangyarihang Singil:",
  "checkout.estimatedInYourPreferred": "Tinatayang halaga sa iyong nais na pananalapi:",
  "checkout.notice": "Paunawa:",
  "checkout.quoteExpired": "Nag-expire na ang Quote:",
};
