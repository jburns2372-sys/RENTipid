import type { AdaptedKnowledge, KnowledgeRegistryEntry } from '../types';

const PUBLISHED_ROUTE_KNOWLEDGE: Record<string, AdaptedKnowledge> = {
  'route.terms': {
    title: 'RENTipid Terms and Conditions',
    content: `# RENTipid Terms and Conditions

RENTipid is a rental marketplace platform. Users remain responsible for ensuring listed assets are legally owned, legally rentable, safe, and compliant with applicable law. RENTipid facilitates the marketplace and users must provide accurate account and KYC information.

## Listing rules

Weapons, illegal substances, and hazardous materials are prohibited. The active Prohibited Items policy catalogue provides the authoritative detailed classifications.

## Booking and payments

General information can explain booking and payment steps, but it cannot change a booking or carry out a refund, payout, or deposit release.`,
    keywords: ['terms', 'marketplace', 'listing', 'booking', 'payment', 'deposit'],
  },
  'route.safety': {
    title: 'RENTipid Trust and Safety',
    content: `# Trust and Safety

Users are responsible for ensuring assets are legally owned, rentable, safe, and compliant. Identity verification is required before transacting where the current RENTipid workflow requires it. Users should not arrange payment outside RENTipid. Prohibited or restricted listings are evaluated by the active policy catalogue and may require review.`,
    keywords: ['safety', 'kyc', 'identity', 'payments', 'prohibited'],
  },
  'route.prohibited-items': {
    title: 'Prohibited and Restricted Items',
    content: `# Prohibited and Restricted Items

RENTipid prohibits, restricts, or does not support certain items, assets, and services to protect the community. The active ProhibitedItemPolicy catalogue is the authoritative detailed source. Providers should review that catalogue before publishing a listing and contact Support when an item cannot be confidently classified.`,
    keywords: ['prohibited', 'restricted', 'items', 'listings', 'policy'],
  },
  'route.privacy': {
    title: 'RENTipid Privacy Policy',
    content: `# Privacy Policy

Privacy Policy version 1.0.0 is effective from 2026-08-05. The controller is OneSystems Integration Philippines Inc. Data-subject requests are submitted through the RENTipid Privacy request workflow. Cookie preferences are managed separately through the Cookie Preferences page.`,
    keywords: ['privacy', 'consent', 'data subject', 'controller', 'request'],
  },
  'route.privacy-cookies': {
    title: 'RENTipid Cookie Preferences',
    content: `# Cookie Preferences

Strictly necessary cookies support navigation, secure areas, and session continuity. Users can manage optional functional, analytics, and marketing preferences. Optional preferences must be recorded through the approved consent workflow and do not override privacy or authorization controls.`,
    keywords: ['privacy', 'cookies', 'consent', 'analytics', 'marketing'],
  },
  'route.beta-guide': {
    title: 'RENTipid Beta Guide',
    content: `# RENTipid Beta Guide

The beta is a controlled testing environment. Real payments and live social posting are disabled in the approved beta configuration. Participants may test registration, mock identity verification, listings, bookings, claims, and AI support using test data only.`,
    keywords: ['beta', 'testing', 'mock', 'payments', 'social'],
  },
};

export async function adaptPublishedRoute(entry: KnowledgeRegistryEntry): Promise<AdaptedKnowledge> {
  if (entry.adapter !== 'published-route-allowlist') {
    throw new Error(`PUBLISHED_ROUTE_ADAPTER_REJECTED:${entry.sourceKey}`);
  }
  const knowledge = PUBLISHED_ROUTE_KNOWLEDGE[entry.sourceKey];
  if (!knowledge) throw new Error(`PUBLISHED_ROUTE_NOT_ALLOWLISTED:${entry.sourceKey}`);
  return {
    ...knowledge,
    metadata: {
      representation: 'ALLOWLISTED_PUBLISHED_ROUTE',
      routeLocator: entry.sourceLocator,
    },
  };
}
