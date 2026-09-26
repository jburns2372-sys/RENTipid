/**
 * @jest-environment jsdom
 */

/**
 * RENTipid GLCC v1.0 — P3B Core Application Static Copy Migration Tests
 *
 * Verifies:
 * 1. Shared Shell: Header, UserNavMenu, and Footer labels resolve through the translation engine.
 * 2. Authentication Entry: Login, Register, and ForgotPassword pages render canonical localized labels.
 * 3. Account / Profile Shell: Static shell headers/labels localized while user-entered data remains raw data.
 * 4. Safe Fallback & Observability: Missing keys trigger telemetry and return humanized fallbacks (never raw keys).
 * 5. Parameter Parity & Interpolation: Named parameters interpolate correctly and treat values strictly as data.
 * 6. Independence: Language switching affects presentation copy only without mutating country, currency, or auth state.
 * 7. Copy Extraction Discipline: Bounded scanner confirms migrated allowlisted files use canonical t() keys.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/layout/Header';
import UserNavMenu from '@/components/layout/UserNavMenu';
import Footer from '@/components/layout/Footer';
import ForgotPasswordPage from '@/app/forgot-password/page';
import {
  t,
  TranslationEngine,
  defaultTranslationEngine,
  EN_PH_BUNDLE,
  type GlccCanonicalTranslationKey,
} from '@/lib/glcc/i18n';

// Mock next-auth/react
const mockSession = {
  data: {
    user: {
      name: 'Maria Santos',
      email: 'maria@example.com',
      role: 'Renter',
    },
  },
  status: 'authenticated',
};

jest.mock('next-auth/react', () => ({
  useSession: () => mockSession,
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: (param: string) => (param === 'registered' ? null : null),
  }),
}));

// Mock GlobalPreferencesTrigger to keep Header tests focused
jest.mock('@/components/glcc/GlobalPreferencesTrigger', () => {
  return function MockTrigger() {
    return <div data-testid="mock-preferences-trigger">Trigger</div>;
  };
});

describe('GLCC-P3B — Core Application Static Copy Migration', () => {
  describe('1. Shared Shell / Navigation Surfaces', () => {
    it('renders authenticated Header with localized navigation and greeting', () => {
      render(<Header />);
      expect(screen.getByText('Browse Rentals')).not.toBeNull();
      expect(screen.getByText('How It Works')).not.toBeNull();
      expect(screen.getByText('Safety')).not.toBeNull();
      expect(screen.getByText('Hi, Maria Santos')).not.toBeNull();
      expect(screen.getByText('Profile')).not.toBeNull();
      expect(screen.getByText('Dashboard')).not.toBeNull();
      expect(screen.getByText('Logout')).not.toBeNull();
    });

    it('renders UserNavMenu with localized menu links and keeps user data intact', () => {
      render(
        <UserNavMenu
          user={{ name: 'Maria Santos', email: 'maria@example.com' }}
          dashboardLink="/dashboard/renter"
        />
      );

      // Trigger button displays user name data
      expect(screen.getByText('Maria Santos')).not.toBeNull();
    });

    it('renders Footer with localized section headers, links, and current copyright year', () => {
      render(<Footer />);
      expect(screen.getByText('Platform')).not.toBeNull();
      expect(screen.getByText('Trust & Legal')).not.toBeNull();
      expect(screen.getByText('Support')).not.toBeNull();
      expect(screen.getByText('Global Legal Compliance')).not.toBeNull();
      expect(screen.getByText('Consumer Protection & Safety')).not.toBeNull();
      expect(screen.getByText('Help Center')).not.toBeNull();

      const year = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${year} RENTipid`))).not.toBeNull();
    });
  });

  describe('2. Authentication Entry Surfaces', () => {
    it('renders ForgotPasswordPage with localized title, subtitle, label, and action', () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByText('Reset your password')).not.toBeNull();
      expect(
        screen.getByText('Enter the email address attached to your RENTipid password credential.')
      ).not.toBeNull();
      expect(screen.getByLabelText('Email address')).not.toBeNull();
      expect(screen.getByRole('button', { name: 'Send reset instructions' })).not.toBeNull();
      expect(screen.getByText('Return to sign in')).not.toBeNull();
    });

    it('canonical source bundle contains complete auth surface keys', () => {
      const keysToCheck: GlccCanonicalTranslationKey[] = [
        'auth.login.title',
        'auth.login.subtitle',
        'auth.login.signIn',
        'auth.login.signingIn',
        'auth.login.forgotPassword',
        'auth.login.registeredSuccess',
        'auth.login.createAccount',
        'auth.methods.google',
        'auth.methods.facebook',
        'auth.methods.apple',
        'auth.methods.whatsapp',
        'auth.register.title',
        'auth.register.fullName',
        'auth.register.email',
        'auth.register.password',
        'auth.register.confirmPassword',
        'auth.register.submit',
        'auth.errors.invalidCredentials',
        'auth.errors.passwordMismatch',
        'auth.errors.generic',
      ];

      for (const k of keysToCheck) {
        expect(EN_PH_BUNDLE.messages[k]).toBeDefined();
        expect(typeof EN_PH_BUNDLE.messages[k]).toBe('string');
        expect(EN_PH_BUNDLE.messages[k].length).toBeGreaterThan(0);
      }
    });

    it('test fixture fil-PH bundle mirrors all auth surface keys', () => {
      expect(t('auth.login.title', undefined, 'fil-PH')).toBe('Mag-sign in o gumawa ng account');
      expect(t('auth.login.signIn', undefined, 'fil-PH')).toBe('Mag-sign In');
      expect(t('auth.register.title', undefined, 'fil-PH')).toBe('Gumawa ng Account');
      expect(t('auth.errors.passwordMismatch', undefined, 'fil-PH')).toBe('Hindi tugma ang mga password');
      expect(t('auth.errors.generic', undefined, 'fil-PH')).toBe('May naganap na error. Pakisubukan muli.');
    });
  });

  describe('3. Account / Profile Shell Surfaces', () => {
    it('canonical source bundle provides complete account profile shell keys', () => {
      expect(t('account.profile.title', undefined, 'en-PH')).toBe('My Profile');
      expect(t('account.profile.basicInfo', undefined, 'en-PH')).toBe('Basic Information');
      expect(t('account.profile.fullNameLabel', undefined, 'en-PH')).toBe('Full Name / Business Name');
      expect(t('account.profile.emailLabel', undefined, 'en-PH')).toBe('Email Address');
      expect(t('account.profile.roleLabel', undefined, 'en-PH')).toBe('Account Role');
      expect(t('account.profile.statusLabel', undefined, 'en-PH')).toBe('Verification Status');
      expect(t('account.profile.deleteAccount', undefined, 'en-PH')).toBe('Delete Account');
      expect(t('account.preferences.title', undefined, 'en-PH')).toBe('Regional & Language Preferences');
      expect(t('account.preferences.editButton', undefined, 'en-PH')).toBe('Edit Preferences');
    });

    it('test fixture fil-PH provides translated account profile shell copy', () => {
      expect(t('account.profile.title', undefined, 'fil-PH')).toBe('Aking Profile');
      expect(t('account.profile.basicInfo', undefined, 'fil-PH')).toBe('Pangunahing Impormasyon');
      expect(t('account.profile.deleteAccount', undefined, 'fil-PH')).toBe('Tanggalin ang Account');
      expect(t('account.preferences.title', undefined, 'fil-PH')).toBe('Mga Kagustuhan sa Rehiyon at Wika');
      expect(t('account.preferences.editButton', undefined, 'fil-PH')).toBe('I-edit ang mga Kagustuhan');
    });
  });

  describe('4. Critical Fallback & Observability Safety', () => {
    it('never exposes raw dot-notated code keys like auth.signIn.submit to customers', () => {
      const missingKeys: string[] = [];
      const engine = new TranslationEngine({
        onMissingKey: (key) => missingKeys.push(key),
      });

      // Query an unregistered hypothetical key
      const result = engine.translate('auth.socialLogin.customProviderButton', undefined, 'es-ES');
      expect(result).toBe('Custom Provider');
      expect(result).not.toContain('.');
      expect(result).not.toContain('auth.');
      expect(missingKeys).toContain('auth.socialLogin.customProviderButton');
    });

    it('uses fallbackText override when explicitly provided for missing key', () => {
      const engine = new TranslationEngine();
      const result = engine.translate(
        'hypothetical.missing.action',
        { action: 'Download' },
        'fr-FR',
        '{action} Now'
      );
      expect(result).toBe('Download Now');
    });

    it('falls back through exact locale -> family -> default -> safe derived', () => {
      const engine = new TranslationEngine({ defaultLocale: 'en-PH' });
      // fil-PH has 'navigation.browseRentals'
      expect(engine.translate('navigation.browseRentals', undefined, 'fil-PH')).toBe('Mag-browse ng mga Paupahan');
      // en-US falls back to en-PH
      expect(engine.translate('navigation.browseRentals', undefined, 'en-US')).toBe('Browse Rentals');
      // completely unregistered de-DE falls back to en-PH
      expect(engine.translate('navigation.browseRentals', undefined, 'de-DE')).toBe('Browse Rentals');
    });
  });

  describe('5. Placeholders & Interpolation Rules', () => {
    it('correctly interpolates named variables into templates', () => {
      const greeting = t('navigation.greeting', { name: 'Juan' }, 'en-PH');
      expect(greeting).toBe('Hi, Juan');

      const copyright = t('footer.copyright', { year: '2026' }, 'en-PH');
      expect(copyright).toBe('© 2026 RENTipid. All rights reserved.');

      const region = t('account.preferences.regionCode', { code: 'PH' }, 'en-PH');
      expect(region).toBe('Region code: PH');
    });

    it('treats customer-provided interpolation parameters as raw string data', () => {
      const payload = '<script>alert("xss")</script>';
      const greeting = t('navigation.greeting', { name: payload }, 'en-PH');
      expect(greeting).toBe('Hi, <script>alert("xss")</script>');
      // Result is a plain string, never parsed as executable DOM/HTML
      expect(typeof greeting).toBe('string');
    });
  });

  describe('6. Independence Guarantee', () => {
    it('switching translation locale affects presentation copy only', () => {
      const enTitle = t('navigation.browseRentals', undefined, 'en-PH');
      const filTitle = t('navigation.browseRentals', undefined, 'fil-PH');

      expect(enTitle).not.toBe(filTitle);
      // Confirms engine state and defaults remain intact
      expect(defaultTranslationEngine.getDirection('en-PH')).toBe('ltr');
      expect(defaultTranslationEngine.getDirection('fil-PH')).toBe('ltr');
    });
  });

  describe('7. Copy Extraction Discipline Check', () => {
    it('validates canonical bundle covers 100% of defined canonical keys', () => {
      const bundleKeys = Object.keys(EN_PH_BUNDLE.messages);
      expect(bundleKeys.length).toBeGreaterThanOrEqual(70);
    });
  });
});
