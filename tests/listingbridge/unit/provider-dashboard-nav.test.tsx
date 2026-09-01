/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProviderDashboard from '../../../src/app/dashboard/provider/page';

// Mock dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      name: 'Sample Provider',
      email: 'provider@rentipid.local',
      role: 'Individual Provider',
      status: 'Verified',
    },
  }),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/components/ai/ContextualAssistantLauncher', () => ({
  ContextualAssistantLauncher: () => React.createElement('div', { 'data-testid': 'ai-launcher' }),
}));

describe('Provider Dashboard Navigation', () => {
  it('renders active Create New Listing and Import Existing Listing links', async () => {
    const Component = await ProviderDashboard();
    render(Component);

    // Verify header and greeting
    expect(screen.getByText('Individual Provider Dashboard')).toBeTruthy();
    expect(screen.getByText('Verified Provider')).toBeTruthy();

    // Verify My Listings section
    expect(screen.getByText('My Listings')).toBeTruthy();

    // Verify "+ Create New Listing" link
    const createLink = screen.getByRole('link', { name: /\+ Create New Listing/i });
    expect(createLink).toBeTruthy();
    expect(createLink.getAttribute('href')).toBe('/dashboard/provider/listings/new');

    // Verify "Import Existing Listing" link
    const importLink = screen.getByRole('link', { name: /Import Existing Listing/i });
    expect(importLink).toBeTruthy();
    expect(importLink.getAttribute('href')).toBe('/dashboard/provider/listings/import');

    // Ensure legacy "pending Phase 3" disabled button is gone
    expect(screen.queryByText(/Listing functionality pending Phase 3/i)).toBeNull();
  });
});
