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

RENTipid prohibits, restricts, or does not support certain items, assets, and services to protect the community.

## Active Prohibited and Restricted Item Policies

1. Illegal Drugs and Controlled Substances (prohibited)
2. Medicines, Health Products and Medical Substances (prohibited)
3. Firearms, Ammunition, Weapons and Explosives (prohibited)
4. Hazardous Chemicals, Toxic Materials and Waste (prohibited)
5. Alcohol, Tobacco, Nicotine and Vape Products (prohibited)
6. Stolen Property and Illegal Acquisitions (prohibited)
7. Counterfeit, Forged and Fraudulent Items (prohibited)
8. Fireworks, Pyrotechnics and Explosives (prohibited)
9. Live Animals, Endangered Species and Animal Products (prohibited)
10. Human Remains, Organs and Body Parts (prohibited)
11. Adult, Sexually Oriented and Pornographic Materials (prohibited)
12. Gambling, Lotteries and Betting Services (prohibited)
13. Invasive Surveillance and Eavesdropping Devices (prohibited)
14. Hate Speech, Discriminatory and Extremist Items (prohibited)
15. Financial Instruments, Securities and Currency (prohibited)
16. Government, Military and Official Items (prohibited)
17. Unsafe, Recalled and Non-Compliant Consumer Goods (prohibited)
18. Expired, Uninspected or Perishable Consumables (prohibited)
19. Unlicensed Real Estate, Subleases and Unauthorized Spaces (restricted)
20. Uncertified High-Risk Equipment and Heavy Machinery (restricted)
21. Illegal, Unauthorized or Regulated Professional Services (prohibited)
22. Cyber Exploitation Tools and Hacking Devices (prohibited)
23. Regulated Wildlife and Plant Species (prohibited)
24. Hazardous Flammables and Combustibles (prohibited)
25. Unauthorized Key Duplication and Lock Bypass Tools (prohibited)`,
    keywords: ['prohibited', 'restricted', 'items', 'listings', 'policy', 'banned', 'drugs', 'weapons', 'firearms'],
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
