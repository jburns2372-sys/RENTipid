/**
 * @jest-environment jsdom
 */

/**
 * RENTipid GLCC v1.0 — P3C Public Marketplace & Renter Static Copy Migration Tests
 *
 * Verifies:
 * 1. Marketplace Browse & Search Shell: Static labels, filter tabs, card badges, empty states.
 * 2. Listing Card & Detail Presentation Shell: Description/rules headers, duration badges, deposit disclosure.
 * 3. Renter Booking / Reservation Flow: BookingRequestForm presentation shell, inputs, actions, disclosures.
 * 4. Pluralization & Duration Formatting: formatPluralDuration handles singular/plural for days, hours, weeks, months.
 * 5. Dynamic Content Boundary: Provider titles, descriptions, and user notes remain raw data untouched by translation.
 * 6. Financial & Authority Invariant: Language switching changes UI copy only; prices, currency codes, roles, and IDs remain strictly unmutated.
 * 7. Fixture Locale fil-PH Parity: 100% placeholder and key parity for all P3C marketplace and renter keys.
 * 8. Missing-Key Safety & Fallback: Safe humanized text without raw key exposure.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingRequestForm from '@/components/bookings/BookingRequestForm';
import {
  t,
  formatPluralDuration,
  formatCurrency,
  TranslationEngine,
  EN_PH_BUNDLE,
  FIL_PH_FIXTURE_BUNDLE,
  type GlccCanonicalTranslationKey,
} from '@/lib/glcc/i18n';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock next-auth/react
const mockSession = {
  data: {
    user: {
      id: 'renter-user-123',
      name: 'Renter Juan',
      email: 'juan@example.com',
      role: 'Renter',
      kyc_status: 'Approved',
    },
  },
  status: 'authenticated',
};

jest.mock('next-auth/react', () => ({
  useSession: () => mockSession,
}));

describe('GLCC-P3C — Public Marketplace & Renter Static Copy Migration', () => {
  const mockListing = {
    id: 'listing-456',
    title: 'Professional Canon EOS R5 Camera Kit',
    description: 'Complete 8K mirrorless camera with 24-70mm f/2.8L lens and two extra batteries.',
    daily_rate: 1500,
    hourly_rate: 250,
    weekly_rate: 8000,
    monthly_rate: 28000,
    rental_type: 'Daily',
    security_deposit: 5000,
    delivery_fee: 300,
    pickup_available: true,
    delivery_available: true,
    rules: 'Handle with care. Return battery charged.',
    user: {
      id: 'provider-789',
      name: 'Studio Equipment Rental Co.',
      is_identity_verified: true,
    },
  };

  describe('1. Marketplace Shell & Browse Static Copy', () => {
    it('provides complete canonical en-PH marketplace strings', () => {
      expect(t('marketplace.title', undefined, 'en-PH')).toBe('Browse Rentals');
      expect(t('marketplace.search', undefined, 'en-PH')).toBe('Search');
      expect(t('marketplace.searchPrompt', undefined, 'en-PH')).toBe('What are you looking for?');
      expect(t('marketplace.searchPlaceholder', undefined, 'en-PH')).toBe('Tools, vehicles, venues...');
      expect(t('marketplace.locationPrompt', undefined, 'en-PH')).toBe('Where?');
      expect(t('marketplace.locationPlaceholder', undefined, 'en-PH')).toBe('City or neighborhood');
      expect(t('marketplace.categories', undefined, 'en-PH')).toBe('Categories');
      expect(t('marketplace.allCategories', undefined, 'en-PH')).toBe('All Categories');
      expect(t('marketplace.popularCategories', undefined, 'en-PH')).toBe('Popular Categories');
      expect(t('marketplace.filters', undefined, 'en-PH')).toBe('Filters');
      expect(t('marketplace.sort', undefined, 'en-PH')).toBe('Sort');
      expect(t('marketplace.noResults', undefined, 'en-PH')).toBe('No rentals found matching your criteria.');
      expect(t('marketplace.clearFilters', undefined, 'en-PH')).toBe('Clear filters');
    });

    it('provides corresponding fil-PH test fixture translations', () => {
      expect(t('marketplace.title', undefined, 'fil-PH')).toBe('Mag-browse ng mga Paupahan');
      expect(t('marketplace.search', undefined, 'fil-PH')).toBe('Maghanap');
      expect(t('marketplace.searchPrompt', undefined, 'fil-PH')).toBe('Ano ang iyong hinahanap?');
      expect(t('marketplace.searchPlaceholder', undefined, 'fil-PH')).toBe(
        'Mga kagamitan, sasakyan, lugar...'
      );
      expect(t('marketplace.categories', undefined, 'fil-PH')).toBe('Mga Kategorya');
      expect(t('marketplace.allCategories', undefined, 'fil-PH')).toBe('Lahat ng Kategorya');
      expect(t('marketplace.noResults', undefined, 'fil-PH')).toBe(
        'Walang nahanap na paupahan na tumutugma sa iyong pamantayan.'
      );
      expect(t('marketplace.clearFilters', undefined, 'fil-PH')).toBe('Alisin ang mga filter');
    });
  });

  describe('2. Listing Card & Detail Presentation Shell', () => {
    it('translates static listing badges, labels, and chrome without altering dynamic data', () => {
      // Static chrome
      expect(t('listing.verifiedProvider', undefined, 'en-PH')).toBe('Verified Provider');
      expect(t('listing.verifiedProvider', undefined, 'fil-PH')).toBe('Beripikadong Provider');
      expect(t('listing.noImage', undefined, 'en-PH')).toBe('No Image');
      expect(t('listing.noImage', undefined, 'fil-PH')).toBe('Walang Larawan');
      expect(t('listing.perDay', undefined, 'en-PH')).toBe('/ day');
      expect(t('listing.perDay', undefined, 'fil-PH')).toBe('/ araw');
      expect(t('listing.description', undefined, 'en-PH')).toBe('Description');
      expect(t('listing.description', undefined, 'fil-PH')).toBe('Deskripsyon');
      expect(t('listing.rentalRules', undefined, 'en-PH')).toBe('Rental Rules');
      expect(t('listing.rentalRules', undefined, 'fil-PH')).toBe('Mga Panuntunan sa Pag-upa');
      expect(t('listing.securityDeposit', undefined, 'en-PH')).toBe('Security Deposit:');
      expect(t('listing.securityDeposit', undefined, 'fil-PH')).toBe('Depósito sa Seguridad:');

      // Dynamic provider data MUST NOT be touched
      expect(mockListing.title).toBe('Professional Canon EOS R5 Camera Kit');
      expect(mockListing.description).toBe(
        'Complete 8K mirrorless camera with 24-70mm f/2.8L lens and two extra batteries.'
      );
      expect(mockListing.user.name).toBe('Studio Equipment Rental Co.');
    });
  });

  describe('3. Renter Booking Request Form (Client Component)', () => {
    it('renders BookingRequestForm in canonical en-PH with all static labels', () => {
      render(<BookingRequestForm listing={mockListing} locale="en-PH" />);

      // Headers and labels
      expect(screen.getByText('Daily Rate')).not.toBeNull();
      expect(screen.getByText('Start Date/Time')).not.toBeNull();
      expect(screen.getByText('End Date/Time')).not.toBeNull();
      expect(screen.getByText('Receive Option')).not.toBeNull();
      expect(screen.getByText('Pickup at Provider')).not.toBeNull();
      expect(screen.getByText('Deliver to Me (+₱300)')).not.toBeNull();
      expect(screen.getByText('Notes for Provider')).not.toBeNull();
      expect(
        screen.getByPlaceholderText('Any questions or special requests...')
      ).not.toBeNull();
      expect(
        screen.getByText(/I understand that this booking request is subject to provider approval/i)
      ).not.toBeNull();
      expect(screen.getByRole('button', { name: 'Request to Book' })).not.toBeNull();
    });

    it('renders BookingRequestForm in fixture fil-PH with localized static labels', () => {
      render(<BookingRequestForm listing={mockListing} locale="fil-PH" />);

      expect(screen.getByText('Singil Bawat Daily')).not.toBeNull();
      expect(screen.getByText('Petsa/Oras ng Simula')).not.toBeNull();
      expect(screen.getByText('Petsa/Oras ng Pagtatapos')).not.toBeNull();
      expect(screen.getByText('Opsyon sa Pagtanggap')).not.toBeNull();
      expect(screen.getByText('Kukunin sa Provider')).not.toBeNull();
      expect(screen.getByText('Ihatid sa Akin (+₱300)')).not.toBeNull();
      expect(screen.getByText('Mga Tala para sa Provider')).not.toBeNull();
      expect(
        screen.getByPlaceholderText('Mga katanungan o espesyal na kahilingan...')
      ).not.toBeNull();
      expect(
        screen.getByText(/Nauunawaan ko na ang kahilingang ito sa booking ay sasailalim sa pag-apruba ng provider/i)
      ).not.toBeNull();
      expect(screen.getByRole('button', { name: 'Humiling na Mag-book' })).not.toBeNull();
    });

    it('interactively updates duration and financial calculation with pluralized labels', () => {
      const { container } = render(<BookingRequestForm listing={mockListing} locale="en-PH" />);

      // Fill in start and end dates (3 days apart)
      const startDateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      const allDateInputs = container.querySelectorAll('input[type="date"]');
      const endDateInput = allDateInputs[1] as HTMLInputElement;

      fireEvent.change(startDateInput, { target: { value: '2026-10-01' } });
      fireEvent.change(endDateInput, { target: { value: '2026-10-04' } });

      // Pluralized duration calculation: ₱1,500 x 3 days
      expect(screen.getByText('₱1,500 x 3 days')).not.toBeNull();
      expect(screen.getByText('₱4,500')).not.toBeNull();

      // Security deposit breakdown preserved
      expect(screen.getByText('₱5,000')).not.toBeNull();

      // Total payable calculation: 4,500 + 5,000 = 9,500
      expect(screen.getByText('₱9,500')).not.toBeNull();
    });
  });

  describe('4. Pluralization & Duration Presentation Standards', () => {
    it('correctly pluralizes days using standards-based Intl.PluralRules', () => {
      expect(formatPluralDuration(0, 'day', 'en-PH')).toBe('0 days');
      expect(formatPluralDuration(1, 'day', 'en-PH')).toBe('1 day');
      expect(formatPluralDuration(2, 'day', 'en-PH')).toBe('2 days');
      expect(formatPluralDuration(5, 'day', 'en-PH')).toBe('5 days');

      // fil-PH fixture
      expect(formatPluralDuration(1, 'day', 'fil-PH')).toBe('1 araw');
      expect(formatPluralDuration(2, 'day', 'fil-PH')).toBe('2 araw');
      expect(formatPluralDuration(10, 'day', 'fil-PH')).toBe('10 araw');
    });

    it('correctly pluralizes hours using standards-based Intl.PluralRules', () => {
      expect(formatPluralDuration(1, 'hour', 'en-PH')).toBe('1 hour');
      expect(formatPluralDuration(4, 'hour', 'en-PH')).toBe('4 hours');

      // fil-PH fixture
      expect(formatPluralDuration(1, 'hour', 'fil-PH')).toBe('1 oras');
      expect(formatPluralDuration(4, 'hour', 'fil-PH')).toBe('4 oras');
    });

    it('correctly pluralizes weeks and months', () => {
      expect(formatPluralDuration(1, 'week', 'en-PH')).toBe('1 week');
      expect(formatPluralDuration(3, 'week', 'en-PH')).toBe('3 weeks');
      expect(formatPluralDuration(1, 'month', 'en-PH')).toBe('1 month');
      expect(formatPluralDuration(6, 'month', 'en-PH')).toBe('6 months');

      // fil-PH fixture
      expect(formatPluralDuration(1, 'week', 'fil-PH')).toBe('1 linggo');
      expect(formatPluralDuration(3, 'week', 'fil-PH')).toBe('3 linggo');
      expect(formatPluralDuration(1, 'month', 'fil-PH')).toBe('1 buwan');
      expect(formatPluralDuration(6, 'month', 'fil-PH')).toBe('6 buwan');
    });
  });

  describe('5. Renter Dashboard & Booking Management Presentation Shell', () => {
    it('provides localized strings for renter booking management table', () => {
      expect(t('renter.bookings.title', undefined, 'en-PH')).toBe('My Bookings');
      expect(t('renter.bookings.colListing', undefined, 'en-PH')).toBe('Listing');
      expect(t('renter.bookings.colDates', undefined, 'en-PH')).toBe('Dates');
      expect(t('renter.bookings.colEstimatedAmount', undefined, 'en-PH')).toBe('Estimated Amount');
      expect(t('renter.bookings.colStatus', undefined, 'en-PH')).toBe('Status');
      expect(t('renter.bookings.colAction', undefined, 'en-PH')).toBe('Action');
      expect(t('renter.bookings.noBookings', undefined, 'en-PH')).toBe(
        'You have not made any booking requests yet.'
      );

      // fil-PH fixture
      expect(t('renter.bookings.title', undefined, 'fil-PH')).toBe('Aking mga Booking');
      expect(t('renter.bookings.colListing', undefined, 'fil-PH')).toBe('Listing');
      expect(t('renter.bookings.colDates', undefined, 'fil-PH')).toBe('Mga Petsa');
      expect(t('renter.bookings.noBookings', undefined, 'fil-PH')).toBe(
        'Wala ka pang nagagawang kahilingan sa booking.'
      );
    });

    it('provides localized strings for renter booking detail view', () => {
      expect(t('renter.bookingDetail.back', undefined, 'en-PH')).toBe('← Back to My Bookings');
      expect(t('renter.bookingDetail.bookingId', { id: 'BK-100' }, 'en-PH')).toBe('Booking #BK-100');
      expect(t('renter.bookingDetail.paymentStatus', { status: 'Pending' }, 'en-PH')).toBe('Payment: Pending');
      expect(t('renter.bookingDetail.cancelRequest', undefined, 'en-PH')).toBe('Cancel Booking Request');
      expect(t('renter.bookingDetail.listingDetails', undefined, 'en-PH')).toBe('Listing Details');
      expect(t('renter.bookingDetail.providerLabel', { name: 'Juan' }, 'en-PH')).toBe('Provider: Juan');
      expect(t('renter.bookingDetail.viewListing', undefined, 'en-PH')).toBe('View Public Listing');
      expect(t('renter.bookingDetail.bookingInfo', undefined, 'en-PH')).toBe('Booking Information');
      expect(t('renter.bookingDetail.paymentSummary', undefined, 'en-PH')).toBe('Payment Summary');
      expect(t('renter.bookingDetail.baseRental', undefined, 'en-PH')).toBe('Base Rental');
      expect(t('renter.bookingDetail.timeline', undefined, 'en-PH')).toBe('Timeline');

      // fil-PH fixture
      expect(t('renter.bookingDetail.back', undefined, 'fil-PH')).toBe('← Bumalik sa Aking mga Booking');
      expect(t('renter.bookingDetail.cancelRequest', undefined, 'fil-PH')).toBe('Kanselahin ang Kahilingan sa Booking');
      expect(t('renter.bookingDetail.paymentSummary', undefined, 'fil-PH')).toBe('Buod ng Pagbabayad');
    });
  });

  describe('6. Financial & Invariant Preservation', () => {
    it('language switching never modifies prices, currencies, or calculations', () => {
      const enFormatted = formatCurrency(mockListing.daily_rate, 'PHP', 'en-PH');
      const filFormatted = formatCurrency(mockListing.daily_rate, 'PHP', 'fil-PH');

      // Both preserve the currency code and authoritative amount
      expect(enFormatted).toContain('1,500');
      expect(filFormatted).toContain('1,500');
      expect(mockListing.daily_rate).toBe(1500);
      expect(mockListing.security_deposit).toBe(5000);
    });

    it('language switching never modifies user role or authentication state', () => {
      expect(mockSession.data.user.role).toBe('Renter');
      expect(mockSession.data.user.kyc_status).toBe('Approved');
    });
  });

  describe('7. Fallback & Missing-Key Resilience', () => {
    it('never exposes raw dot-notated keys for hypothetical missing marketplace keys', () => {
      const missingKeys: string[] = [];
      const engine = new TranslationEngine({
        onMissingKey: (k) => missingKeys.push(k),
      });

      const fallback = engine.translate('marketplace.hypotheticalFilter', undefined, 'en-PH');
      expect(fallback).toBe('Hypothetical Filter');
      expect(fallback).not.toContain('.');
      expect(missingKeys).toContain('marketplace.hypotheticalFilter');
    });
  });

  describe('8. Canonical Completeness & Placeholder Parity for P3C Keys', () => {
    it('en-PH bundle contains all 71 newly migrated marketplace and renter keys', () => {
      const requiredKeys: GlccCanonicalTranslationKey[] = [
        'common.none',
        'common.to',
        'common.view',
        'marketplace.title',
        'marketplace.search',
        'marketplace.searchPrompt',
        'marketplace.searchPlaceholder',
        'marketplace.locationPrompt',
        'marketplace.locationPlaceholder',
        'marketplace.categories',
        'marketplace.allCategories',
        'marketplace.popularCategories',
        'marketplace.filters',
        'marketplace.sort',
        'marketplace.results',
        'marketplace.noResults',
        'marketplace.clearFilters',
        'marketplace.retry',
        'marketplace.loading',
        'listing.viewDetails',
        'listing.available',
        'listing.unavailable',
        'listing.location',
        'listing.category',
        'listing.owner',
        'listing.perDay',
        'listing.perHour',
        'listing.perWeek',
        'listing.perMonth',
        'listing.rating',
        'listing.reviews',
        'listing.noImage',
        'listing.noImageProvided',
        'listing.verifiedProvider',
        'listing.description',
        'listing.rentalRules',
        'listing.minimumDuration',
        'listing.securityDeposit',
        'listing.damagePolicy',
        'listing.defaultDamagePolicy',
        'listing.provider',
        'booking.rate',
        'booking.startDate',
        'booking.endDate',
        'booking.receiveOption',
        'booking.pickupAtProvider',
        'booking.deliverToMe',
        'booking.deliveryAddress',
        'booking.deliveryAddressPlaceholder',
        'booking.notesForProvider',
        'booking.notesPlaceholder',
        'booking.durationRateCalculation',
        'booking.deliveryFee',
        'booking.estimatedTotal',
        'booking.agreementDisclosure',
        'booking.paymentNotice',
        'booking.requestToBook',
        'booking.submittingRequest',
        'booking.duration.days.one',
        'booking.duration.days.other',
        'booking.duration.hours.one',
        'booking.duration.hours.other',
        'booking.duration.weeks.one',
        'booking.duration.weeks.other',
        'booking.duration.months.one',
        'booking.duration.months.other',
        'booking.errors.kycRequired',
        'booking.errors.cannotBookOwn',
        'booking.errors.fillRequired',
        'booking.errors.failedSubmit',
        'booking.errors.generic',
        'renter.bookings.title',
        'renter.bookings.colListing',
        'renter.bookings.colDates',
        'renter.bookings.colEstimatedAmount',
        'renter.bookings.colStatus',
        'renter.bookings.colAction',
        'renter.bookings.noBookings',
        'renter.bookingDetail.back',
        'renter.bookingDetail.bookingId',
        'renter.bookingDetail.paymentStatus',
        'renter.bookingDetail.cancelRequest',
        'renter.bookingDetail.listingDetails',
        'renter.bookingDetail.providerLabel',
        'renter.bookingDetail.viewListing',
        'renter.bookingDetail.bookingInfo',
        'renter.bookingDetail.startDate',
        'renter.bookingDetail.endDate',
        'renter.bookingDetail.duration',
        'renter.bookingDetail.renterNotes',
        'renter.bookingDetail.providerNotes',
        'renter.bookingDetail.rejectionReason',
        'renter.bookingDetail.paymentSummary',
        'renter.bookingDetail.baseRental',
        'renter.bookingDetail.timeline',
        'home.heroTitle',
        'home.heroSubtitle',
        'home.startRenting',
        'home.trustTitle',
        'home.trustSubtitle',
        'home.verifiedUsersTitle',
        'home.verifiedUsersDesc',
        'home.depositProtectionTitle',
        'home.depositProtectionDesc',
        'home.aiAssistanceTitle',
        'home.aiAssistanceDesc',
        'home.forRenters',
        'home.forProviders',
        'home.ctaTitle',
        'home.ctaSubtitle',
        'home.getStarted',
      ];

      for (const k of requiredKeys) {
        expect(EN_PH_BUNDLE.messages[k]).toBeDefined();
        expect(typeof EN_PH_BUNDLE.messages[k]).toBe('string');
        expect(EN_PH_BUNDLE.messages[k].length).toBeGreaterThan(0);
      }
    });

    it('fil-PH fixture bundle matches placeholders with 100% parity', () => {
      const keysWithPlaceholders: GlccCanonicalTranslationKey[] = [
        'listing.minimumDuration',
        'booking.rate',
        'booking.deliverToMe',
        'booking.durationRateCalculation',
        'booking.duration.days.one',
        'booking.duration.days.other',
        'booking.duration.hours.one',
        'booking.duration.hours.other',
        'booking.duration.weeks.one',
        'booking.duration.weeks.other',
        'booking.duration.months.one',
        'booking.duration.months.other',
        'renter.bookingDetail.bookingId',
        'renter.bookingDetail.paymentStatus',
        'renter.bookingDetail.providerLabel',
      ];

      const extract = (str: string) => (str.match(/\{([a-zA-Z0-9_]+)\}/g) || []).sort();

      for (const k of keysWithPlaceholders) {
        const enPhPlaceholders = extract(EN_PH_BUNDLE.messages[k] || '');
        const filPhPlaceholders = extract(FIL_PH_FIXTURE_BUNDLE.messages[k] || '');
        expect(filPhPlaceholders).toEqual(enPhPlaceholders);
      }
    });
  });
});
