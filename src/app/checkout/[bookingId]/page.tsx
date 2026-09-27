/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';
import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { processCheckout } from './actions';
import { InsuranceCheckoutOption } from './InsuranceCheckoutOption';
import { ContextualAssistantLauncher } from '@/components/ai/ContextualAssistantLauncher';
import { cookies } from 'next/headers';
import { CheckoutFxDisclosure } from '@/components/glcc';
import { getServerTranslation } from '@/lib/glcc/i18n/server';
const prisma = new PrismaClient();

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ bookingId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { bookingId } = await params;
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const displayCurrency = cookieStore.get('glcc_currency')?.value || 'PHP';
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const { t } = await getServerTranslation();

  if (!user || (user.role !== 'Renter' && user.role !== 'Individual Provider' && user.role !== 'Business Provider' && user.role !== 'Super Admin')) {
    redirect('/login');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { include: { category: true } },
      rentalAgreement: true
    }
  });

  if (!booking || booking.renter_id !== user.id) {
    notFound();
  }

  if (booking.status !== 'Approved' || booking.payment_status !== 'Pending Payment') {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('checkout.invalidCheckoutState')}</h1>
        <p className="text-gray-600 mb-6">{t('checkout.thisBookingCannotBe')}</p>
        <Link href={`/dashboard/renter/bookings/${booking.id}`} className="text-blue-600 font-bold hover:underline">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  if (!booking.rentalAgreement?.accepted_by_renter) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('checkout.agreementRequired')}</h1>
        <p className="text-gray-600 mb-6">{t('checkout.youMustAcceptThe')}</p>
        <Link href={`/dashboard/renter/bookings/${booking.id}`} className="text-blue-600 font-bold hover:underline">
          {t('agreement.title')}
        </Link>
      </div>
    );
  }

  const setting = await prisma.systemSetting.findUnique({ where: { setting_key: 'payment_provider_mode' }});
  let activeMode = setting?.setting_value || process.env.PAYMENT_PROVIDER_MODE || 'mock';

  const livePilotSetting = await prisma.systemSetting.findUnique({ where: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED' }});
  const isLivePilotEnabled = livePilotSetting?.setting_value === 'true';

  const freezeSetting = await prisma.systemSetting.findUnique({ where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' }});
  const isFrozen = freezeSetting?.setting_value === 'true';

  const pilotRenterId = await prisma.systemSetting.findUnique({ where: { setting_key: 'PILOT_RENTER_ID' }});
  const pilotListingId = await prisma.systemSetting.findUnique({ where: { setting_key: 'PILOT_LISTING_ID' }});
  const pilotMaxAmountStr = await prisma.systemSetting.findUnique({ where: { setting_key: 'PILOT_MAX_AMOUNT' }});
  const pilotMaxAmount = parseFloat(pilotMaxAmountStr?.setting_value || '5000');

  // If live pilot is selected but conditions fail, fallback to sandbox
  if (activeMode === 'paymongo_live_pilot') {
    if (user.id !== pilotRenterId?.setting_value) {
      return (
        <div className="container mx-auto py-20 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">{t('checkout.accessDenied')}</h1>
          <p className="text-gray-600 mb-6">{t('checkout.youAreNotOn')}</p>
          <Link href={`/dashboard/renter/bookings/${booking.id}`} className="text-blue-600 font-bold hover:underline">
            {t('common.back')}
          </Link>
        </div>
      );
    }
    
    if (
      !isLivePilotEnabled || 
      isFrozen ||
      booking.listing_id !== pilotListingId?.setting_value ||
      booking.estimated_total_amount > pilotMaxAmount
    ) {
      activeMode = 'paymongo'; // Fallback to sandbox
    }
  }

  const checkoutRequestId = crypto.randomUUID();

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/renter/bookings/${booking.id}`} className="text-blue-600 hover:underline text-sm font-medium">
          &larr; {t('common.back')}
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">{t('checkout.secureCheckout')}</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Col: Payment Method */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('checkout.paymentMethod')}</h2>
            
            {error === 'provider_activation_pending' && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded text-sm mb-6 flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <strong>{t('checkout.livePaymentMethodsAre')}</strong>
                  <p>{t('checkout.paymongoActivationIsPending')}</p>
                </div>
              </div>
            )}

            {error === 'frozen' && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded text-sm mb-6 flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <strong>{t('checkout.livePaymentIsCurrently')}</strong>
                  <p>{t('checkout.allRealTransactionsAre')}</p>
                </div>
              </div>
            )}

            {activeMode === 'paymongo_live_pilot' && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded text-sm mb-6">
                <strong>{t('checkout.limitedLivePilotEnabled')}</strong> Live pilot payment is enabled for selected users/categories only. Real money will be charged. Continue only if you are part of the approved pilot.
              </div>
            )}

            {activeMode === 'paymongo' && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded text-sm mb-6">
                <strong>{t('checkout.sandboxPaymentModeActive')}</strong> No real money is charged. You will be redirected to PayMongo&apos;s secure sandbox checkout.
              </div>
            )}

            {activeMode === 'mock' && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded text-sm mb-6">
                <strong>{t('checkout.phase5Note')}</strong> This is a mock checkout system. Clicking the button below will mathematically simulate a successful payment.
              </div>
            )}

            <form action={processCheckout}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <input type="hidden" name="payment_mode" value={activeMode} />
              <input type="hidden" name="checkout_request_id" value={checkoutRequestId} />

              <div className="mb-5">
                <InsuranceCheckoutOption
                  bookingId={booking.id}
                  requestId={checkoutRequestId}
                />
              </div>
              
              {activeMode === 'paymongo_live_pilot' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.selectPermittedPilotPayment')}</label>
                  <select name="pilot_payment_method" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="">{t('checkout.chooseMethod')}</option>
                    <option value="gcash">GCash</option>
                    <option value="card">{t('checkout.creditCard')}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{t('checkout.onlyStandardGcashOr')}</p>
                </div>
              )}

              <CheckoutFxDisclosure
                authoritativeAmountPhp={booking.estimated_total_amount}
                targetCurrency={displayCurrency}
                className="mb-5"
              />

              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition shadow-lg flex items-center justify-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <span>Pay ₱{booking.estimated_total_amount.toLocaleString()}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Summary */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('checkout.orderSummary')}</h2>
            <div className="mb-4">
              <h3 className="font-bold text-gray-900">{booking.listing.title}</h3>
              <p className="text-xs text-gray-500">{booking.start_date.toLocaleDateString()} to {booking.end_date.toLocaleDateString()}</p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Rental ({booking.rental_duration} {booking.rental_duration_unit})</span>
                <span className="font-medium">₱{booking.base_rental_amount.toLocaleString()}</span>
              </div>
              {booking.deposit_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('checkout.securityDepositEscrow')}</span>
                  <span className="font-medium">₱{booking.deposit_amount.toLocaleString()}</span>
                </div>
              )}
              {booking.delivery_fee && booking.delivery_fee > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('booking.deliveryFee')}</span>
                  <span className="font-medium">₱{booking.delivery_fee.toLocaleString()}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t pt-3 font-bold text-xl text-gray-900">
                <span>{t('checkout.total')}</span>
                <span>₱{booking.estimated_total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ContextualAssistantLauncher route="checkout" entityId={booking.id} entityType="booking" lifecycle="pending" className="fixed bottom-6 right-6 z-50" />
    </div>
  );
}
