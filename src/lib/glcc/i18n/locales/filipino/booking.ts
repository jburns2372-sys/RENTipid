/**
 * RENTipid GLCC v1.0.1 — Filipino Domain Bundle: booking
 */

import { BOOKING_KEYS } from '../../contracts/booking';

export const BOOKING_FIL_PH: Record<(typeof BOOKING_KEYS)[number], string> = {
  "booking.rate": "Singil Bawat {unit}",
  "booking.startDate": "Petsa/Oras ng Simula",
  "booking.endDate": "Petsa/Oras ng Pagtatapos",
  "booking.receiveOption": "Opsyon sa Pagtanggap",
  "booking.pickupAtProvider": "Kukunin sa Provider",
  "booking.deliverToMe": "Ihatid sa Akin (+₱{fee})",
  "booking.deliveryAddress": "Address ng Paghahatiran",
  "booking.deliveryAddressPlaceholder": "Ilagay ang buong address ng paghahatiran...",
  "booking.notesForProvider": "Mga Tala para sa Provider",
  "booking.notesPlaceholder": "Mga katanungan o espesyal na kahilingan...",
  "booking.durationRateCalculation": "₱{rate} x {duration}",
  "booking.deliveryFee": "Bayad sa Paghahatid",
  "booking.estimatedTotal": "Tinatayang Kabuuan",
  "booking.agreementDisclosure": "Nauunawaan ko na ang kahilingang ito sa booking ay sasailalim sa pag-apruba ng provider, mga patakaran sa pag-upa, mga kinakailangan sa deposito, at mga patakaran ng platapormang RENTipid.",
  "booking.paymentNotice": "Ang pagpoproseso ng pagbabayad ay isaaktibo sa susunod na yugto. Ang kahilingang ito ay hindi pa nangongolekta ng bayad.",
  "booking.requestToBook": "Humiling na Mag-book",
  "booking.submittingRequest": "Ipinapadala ang Kahilingan...",
  "booking.duration.days.one": "{count} araw",
  "booking.duration.days.other": "{count} araw",
  "booking.duration.hours.one": "{count} oras",
  "booking.duration.hours.other": "{count} oras",
  "booking.duration.weeks.one": "{count} linggo",
  "booking.duration.weeks.other": "{count} linggo",
  "booking.duration.months.one": "{count} buwan",
  "booking.duration.months.other": "{count} buwan",
  "booking.errors.kycRequired": "Kailangan mong maging Beripikadong user upang humiling ng booking. Mangyaring kumpletuhin ang KYC verification sa iyong dashboard.",
  "booking.errors.cannotBookOwn": "Hindi mo maaaring i-book ang sarili mong listing.",
  "booking.errors.fillRequired": "Mangyaring punan ang lahat ng kinakailangang field at sumang-ayon sa mga patakaran.",
  "booking.errors.failedSubmit": "Nabigong ipadala ang kahilingan sa booking",
  "booking.errors.generic": "May naganap na error habang ipinapadala ang booking.",
};
