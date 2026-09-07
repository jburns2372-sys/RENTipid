/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { getServerSession } from 'next-auth/next';
import ProviderListingsPage from '@/app/dashboard/provider/listings/page';

jest.mock('@prisma/client', () => {
  const mockListingFindMany = jest.fn();

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      listing: {
        findMany: mockListingFindMany,
      },
    })),
    __mocks: {
      mockListingFindMany,
    },
  };
});

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/components/ai/AIAssistantButton', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'ai-assistant-button' }),
}));

const { __mocks } = require('@prisma/client');
const mockListingFindMany = __mocks.mockListingFindMany;

function listing(overrides: {
  id: string;
  title: string;
  status: string;
  daily_rate?: number;
}) {
  return {
    id: overrides.id,
    title: overrides.title,
    status: overrides.status,
    daily_rate: overrides.daily_rate ?? 8000,
    category: { name: 'Cars and Motorcycles' },
    photos: [],
  };
}

async function renderListingsPage() {
  (getServerSession as jest.Mock).mockResolvedValue({
    user: { id: 'provider-1', role: 'Individual Provider', status: 'Verified' },
  });

  mockListingFindMany.mockResolvedValue([
    listing({ id: 'submitted-bmw', title: 'BMW K1600B', status: 'Submitted for Review' }),
    listing({ id: 'draft-camera', title: 'Draft Camera', status: 'Draft', daily_rate: 1200 }),
    listing({ id: 'rejected-drone', title: 'Rejected Drone', status: 'Rejected', daily_rate: 2500 }),
    listing({ id: 'review-scooter', title: 'Review Scooter', status: 'Under Review', daily_rate: 900 }),
    listing({ id: 'published-bike', title: 'Published Bike', status: 'Published', daily_rate: 700 }),
  ]);

  render(await ProviderListingsPage());
}

function rowFor(title: string) {
  const row = screen.getByText(title).closest('tr');
  if (!row) {
    throw new Error(`No listing row found for ${title}`);
  }
  return within(row);
}

describe('Provider listings table actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows only Manage for a BMW-like submitted listing and hides Edit', async () => {
    await renderListingsPage();

    const row = rowFor('BMW K1600B');
    expect(row.queryByRole('link', { name: /edit bmw k1600b/i })).toBeNull();

    const manageLink = row.getByRole('link', { name: /manage bmw k1600b/i });
    expect(manageLink).toBeTruthy();
    expect(manageLink.getAttribute('href')).toBe('/dashboard/provider/listings/submitted-bmw');
    expect(row.queryByRole('button')).toBeNull();
  });

  it('shows functional Edit and Manage / Submit links for Draft listings', async () => {
    await renderListingsPage();

    const row = rowFor('Draft Camera');
    const editLink = row.getByRole('link', { name: /edit draft camera/i });
    const manageSubmitLink = row.getByRole('link', { name: /manage \/ submit draft camera/i });

    expect(editLink.getAttribute('href')).toBe('/dashboard/provider/listings/draft-camera/edit');
    expect(manageSubmitLink.getAttribute('href')).toBe('/dashboard/provider/listings/draft-camera');
    expect(row.queryByRole('button')).toBeNull();
  });

  it('shows functional Edit and resubmission path for Rejected listings', async () => {
    await renderListingsPage();

    const row = rowFor('Rejected Drone');
    const editLink = row.getByRole('link', { name: /edit rejected drone/i });
    const resubmitLink = row.getByRole('link', { name: /manage \/ resubmit rejected drone/i });

    expect(editLink.getAttribute('href')).toBe('/dashboard/provider/listings/rejected-drone/edit');
    expect(resubmitLink.getAttribute('href')).toBe('/dashboard/provider/listings/rejected-drone');
    expect(row.queryByRole('button')).toBeNull();
  });

  it.each([
    ['Under Review', 'Review Scooter', 'review-scooter'],
    ['Published', 'Published Bike', 'published-bike'],
  ])('shows only Manage for %s listings', async (_status, title, id) => {
    await renderListingsPage();

    const row = rowFor(title);
    expect(row.queryByRole('link', { name: new RegExp(`edit ${title}`, 'i') })).toBeNull();

    const manageLink = row.getByRole('link', { name: new RegExp(`manage ${title}`, 'i') });
    expect(manageLink.getAttribute('href')).toBe(`/dashboard/provider/listings/${id}`);
    expect(row.queryByRole('button')).toBeNull();
  });
});
