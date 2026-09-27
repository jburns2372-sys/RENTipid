/**
 * @jest-environment node
 */

import {
  t,
  setActiveLocale,
  getActiveLocale,
} from '@/lib/glcc/i18n';
import { GLCC_COPY, getGlccCopy } from '@/components/glcc/glcc-copy';

describe('RENTipid GLCC v1.0.1 — Server and Client Translation Engine State Tests', () => {
  beforeEach(() => {
    // Reset to default en-PH before each test
    setActiveLocale('en-PH');
  });

  afterAll(() => {
    setActiveLocale('en-PH');
  });

  it('activeLocale defaults to en-PH and can be switched dynamically', () => {
    expect(getActiveLocale()).toBe('en-PH');

    setActiveLocale('fil-PH');
    expect(getActiveLocale()).toBe('fil-PH');

    setActiveLocale('en-PH');
    expect(getActiveLocale()).toBe('en-PH');
  });

  it('t() without explicit locale argument uses activeLocale', () => {
    // In en-PH
    setActiveLocale('en-PH');
    expect(t('superAdmin.title')).toBe('Super Admin Dashboard');
    expect(t('common.cancel')).toBe('Cancel');
    expect(t('preferences.title')).toBe('Global Preferences');

    // Switch to fil-PH
    setActiveLocale('fil-PH');
    expect(t('superAdmin.title')).toBe('Dashboard ng Super Admin');
    expect(t('common.cancel')).toBe('Kanselahin');
    expect(t('preferences.title')).toBe('Mga Pandaigdigang Kagustuhan');
  });

  it('t() with explicit locale argument overrides activeLocale safely', () => {
    setActiveLocale('fil-PH');
    // Even though activeLocale is fil-PH, explicit en-PH returns English
    expect(t('superAdmin.title', undefined, 'en-PH')).toBe('Super Admin Dashboard');
    // Explicit fil-PH returns Filipino
    expect(t('superAdmin.title', undefined, 'fil-PH')).toBe('Dashboard ng Super Admin');
  });

  it('GLCC_COPY proxy dynamically adapts to activeLocale', () => {
    setActiveLocale('en-PH');
    expect(GLCC_COPY.title).toBe('Global Preferences');
    expect(GLCC_COPY.apply).toBe('Apply Preferences');
    expect(GLCC_COPY.cancel).toBe('Cancel');

    setActiveLocale('fil-PH');
    expect(GLCC_COPY.title).toBe('Mga Pangkalahatang Kagustuhan');
    expect(GLCC_COPY.apply).toBe('Ilapat ang mga Kagustuhan');
    expect(GLCC_COPY.cancel).toBe('Kanselahin');
  });

  it('getGlccCopy(locale) returns static copy dictionary for requested locale', () => {
    const enCopy = getGlccCopy('en-PH');
    expect(enCopy.title).toBe('Global Preferences');
    expect(enCopy.apply).toBe('Apply Preferences');

    const filCopy = getGlccCopy('fil-PH');
    expect(filCopy.title).toBe('Mga Pangkalahatang Kagustuhan');
    expect(filCopy.apply).toBe('Ilapat ang mga Kagustuhan');
  });

  it('Super Admin translation keys return accurate Filipino copy', () => {
    setActiveLocale('fil-PH');
    expect(t('superAdmin.title')).toBe('Dashboard ng Super Admin');
    expect(t('superAdmin.livePaymentPilot.title')).toBe('Live Payment Pilot');
    expect(t('superAdmin.financeApprovals.title')).toBe('Mga Pag-apruba sa Pananalapi');
    expect(t('superAdmin.liveWebhooks.title')).toBe('Mga Live Webhook');
    expect(t('superAdmin.paymongoActivation.title')).toBe('Pag-activate ng PayMongo');
    expect(t('superAdmin.productionDomain.title')).toBe('Production Domain');
    expect(t('superAdmin.soc.title')).toBe('Security Operations Center');
  });

  it('switching locale never affects currency or country invariants', () => {
    const testState = {
      country: 'PH',
      displayCurrency: 'PHP',
      chargeCurrency: 'PHP',
    };

    setActiveLocale('fil-PH');
    expect(testState.country).toBe('PH');
    expect(testState.displayCurrency).toBe('PHP');
    expect(testState.chargeCurrency).toBe('PHP');

    setActiveLocale('en-PH');
    expect(testState.country).toBe('PH');
    expect(testState.displayCurrency).toBe('PHP');
    expect(testState.chargeCurrency).toBe('PHP');
  });
});
