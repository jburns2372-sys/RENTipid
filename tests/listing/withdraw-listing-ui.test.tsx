/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { getServerSession } from 'next-auth/next';
import ProviderListingManagePage from '@/app/dashboard/provider/listings/[id]/page';

jest.mock('@prisma/client', () => {
  const mockListingFindUnique = jest.fn();

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      listing: {
        findUnique: mockListingFindUnique,
      },
    })),
    __mocks: {
      mockListingFindUnique,
    },
  };
});

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('notFound');
  }),
  redirect: jest.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

jest.mock('@/components/ai/AIAssistantButton', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'ai-assistant-button' }),
}));

jest.mock('@/components/listings/PhotoUploader', () => ({
  __esModule: true,
  default: ({ listingId, existingPhotos, isEditable }: { listingId: string; existingPhotos: any[]; isEditable: boolean }) => (
    <div
      data-testid="photo-uploader"
      data-listing-id={listingId}
      data-photo-count={existingPhotos.length}
      data-editable={String(isEditable)}
    />
  ),
}));

jest.mock('@/components/listings/DocumentUploader', () => ({
  __esModule: true,
  default: ({ listingId, existingDocuments, isEditable }: { listingId: string; existingDocuments: any[]; isEditable: boolean }) => (
    <div
      data-testid="document-uploader"
      data-listing-id={listingId}
      data-document-count={existingDocuments.length}
      data-editable={String(isEditable)}
    />
  ),
}));

const { __mocks } = require('@prisma/client');
const mockListingFindUnique = __mocks.mockListingFindUnique;

function manageListing(status: string) {
  return {
    id: 'list-bmw-1',
    provider_id: 'provider-1',
    title: 'BMW K1600B',
    description: 'Touring motorcycle with luggage and full documents',
    category_id: 'cat-cars-motorcycles',
    category: {
      name: 'Cars and Motorcycles',
      risk_level: 'Regulated',
      requirements: [],
    },
    location: '12 Sibad',
    city: 'Quezon City',
    province: 'Metro Manila',
    country: 'Philippines',
    daily_rate: 8000,
    security_deposit: 10000,
    replacement_value: 1200000,
    status,
    rejection_reason: status === 'Rejected' ? 'Needs clearer registration scan' : null,
    photos: [
      { id: 'photo-1', file_path: 'https://blob.vercel-storage.com/bmw-1.jpg', is_cover: true },
      { id: 'photo-2', file_path: 'https://blob.vercel-storage.com/bmw-2.jpg', is_cover: false },
    ],
    documents: [
      {
        id: 'doc-1',
        document_type: 'Vehicle Registration (OR/CR)',
        status: 'Pending',
        uploaded_at: new Date('2026-09-07T00:00:00.000Z'),
      },
    ],
  };
}

async function renderManagePage(status: string) {
  (getServerSession as jest.Mock).mockResolvedValue({
    user: { id: 'provider-1', role: 'Individual Provider', status: 'Verified' },
  });
  mockListingFindUnique.mockResolvedValue(manageListing(status));

  render(await ProviderListingManagePage({
    params: Promise.resolve({ id: 'list-bmw-1' }),
    searchParams: Promise.resolve({}),
  }));
}

describe('Withdraw and edit manage page state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('offers Withdraw & Edit for Submitted for Review without directly reopening editing', async () => {
    await renderManagePage('Submitted for Review');

    expect(screen.getByText('Submitted for Review')).toBeTruthy();
    expect(screen.getByRole('button', { name: /withdraw & edit/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /submit for review/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /edit details/i })).toBeNull();
    expect(screen.getByTestId('photo-uploader').getAttribute('data-editable')).toBe('false');
    expect(screen.getByTestId('document-uploader').getAttribute('data-editable')).toBe('false');
  });

  it('restores detail, photo, and document editing once withdrawal returns listing to Draft', async () => {
    await renderManagePage('Draft');

    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /manage listing: bmw k1600b/i })).toBeTruthy();
    expect(screen.getByText('Cars and Motorcycles')).toBeTruthy();
    expect(screen.getByText((_, element) => element?.textContent === '₱8,000')).toBeTruthy();
    expect(screen.getByText((_, element) => element?.textContent === '12 Sibad, Quezon City')).toBeTruthy();
    expect(screen.getByText('Touring motorcycle with luggage and full documents')).toBeTruthy();
    expect(screen.getByRole('button', { name: /submit for review/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /edit details/i }).getAttribute('href')).toBe('/dashboard/provider/listings/list-bmw-1/edit');
    expect(screen.getByTestId('photo-uploader').getAttribute('data-editable')).toBe('true');
    expect(screen.getByTestId('photo-uploader').getAttribute('data-photo-count')).toBe('2');
    expect(screen.getByTestId('document-uploader').getAttribute('data-editable')).toBe('true');
    expect(screen.getByTestId('document-uploader').getAttribute('data-document-count')).toBe('1');
  });

  it.each(['Under Review', 'Published'])('keeps %s listings locked with no withdraw action', async status => {
    await renderManagePage(status);

    expect(screen.getByText(status)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /withdraw & edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /submit for review/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /edit details/i })).toBeNull();
    expect(screen.getByTestId('photo-uploader').getAttribute('data-editable')).toBe('false');
    expect(screen.getByTestId('document-uploader').getAttribute('data-editable')).toBe('false');
  });
});
