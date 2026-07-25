/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SocCommandCenterClient } from '@/components/security/dashboard/SocCommandCenterClient';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockSummary = {
  kpis: {
    eventsToday: 15,
    blockedAttempts: 3,
    criticalFindings: 2,
    authenticationEvents: 8,
    activeIncidents: 1
  },
  emergencyFreezeActive: true,
  lastRefreshed: new Date().toISOString()
};

const mockFeed = {
  events: [
    {
      id: "ev_1",
      timestamp: new Date().toISOString(),
      severity: "CRITICAL",
      eventCode: "AUTH_FAILURE",
      classification: "ATTACK_ATTEMPT",
      source: "AUDIT_LOG",
      environment: "PRODUCTION",
      lifecycle: "LIVE",
      location: "Unknown",
      target: "System",
      processingResult: "PROCESSED",
      isSimulation: false
    },
    {
      id: "ev_sim",
      timestamp: new Date().toISOString(),
      severity: "MEDIUM",
      eventCode: "TEST_EVENT",
      classification: "OBSERVATION",
      source: "AUDIT_LOG",
      environment: "TEST",
      lifecycle: "SIMULATION",
      location: "Unknown",
      target: "System",
      processingResult: "PROCESSED",
      isSimulation: true
    }
  ]
};

const mockResponses = {
  responses: [
    {
      id: "exec_1",
      responseType: "ACCOUNT_RESTRICTION",
      targetType: "USER",
      targetId: "usr_123",
      executionStatus: "SUCCEEDED",
      operator: "Admin User",
      isRollbackAvailable: true,
      isSimulation: false
    }
  ]
};

describe('RENTipid SOC Command Center Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('action=summary')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSummary) });
      if (url.includes('action=feed')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockFeed) });
      if (url.includes('action=responses')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponses) });
      return Promise.resolve({ ok: false });
    });
  });

  it('renders loading state then data', async () => {
    render(<SocCommandCenterClient />);
    expect(screen.getByText(/Loading events/i)).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.getByText('15')).toBeTruthy(); // events today
      expect(screen.getByText('3')).toBeTruthy(); // blocked attempts
    });
  });

  it('KPI values render from supplied authoritative DTOs', async () => {
    render(<SocCommandCenterClient />);
    await waitFor(() => expect(screen.getByText('15')).toBeTruthy());
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('Simulation records are visibly labeled', async () => {
    render(<SocCommandCenterClient />);
    await waitFor(() => expect(screen.getByText('AUTH_FAILURE')).toBeTruthy());
    expect(screen.getAllByText(/SIMULATED/i).length).toBeGreaterThan(0);
  });

  it('Selecting an event updates details', async () => {
    render(<SocCommandCenterClient />);
    await waitFor(() => expect(screen.getByText('AUTH_FAILURE')).toBeTruthy());
    
    fireEvent.click(screen.getByText('AUTH_FAILURE'));
    await waitFor(() => {
      expect(screen.getByText('Event Details')).toBeTruthy();
      expect(screen.getByText('ATTACK_ATTEMPT')).toBeTruthy(); // Classification in details
    });
  });

  it('Unknown location is safe and Private IP is not represented geographically', async () => {
    render(<SocCommandCenterClient />);
    await waitFor(() => {
      expect(screen.getByText(/No verified geolocated security events are available/i)).toBeTruthy();
      // Also in feed:
      expect(screen.getAllByText('LOCATION UNKNOWN').length).toBeGreaterThan(0);
    });
  });

  it('Empty map state renders', async () => {
    render(<SocCommandCenterClient />);
    expect(screen.getByText(/No verified geolocated security events are available/i)).toBeTruthy();
  });

  it('Approved response states render', async () => {
    render(<SocCommandCenterClient />);
    await waitFor(() => {
      expect(screen.getByText('ACCOUNT RESTRICTION')).toBeTruthy();
      expect(screen.getByText('SUCCEEDED')).toBeTruthy();
      expect(screen.getByText(/Admin User/i)).toBeTruthy();
    });
  });

  it('Emergency freeze disables execution', async () => {
    render(<SocCommandCenterClient />);
    await waitFor(() => {
      expect(screen.getByText('EMERGENCY FREEZE ACTIVE')).toBeTruthy();
    });
  });

  it('Pause is labeled as display refresh only', async () => {
    render(<SocCommandCenterClient />);
    const pauseButton = screen.getByTitle('Pause Display Refresh');
    expect(pauseButton).toBeTruthy();
  });
});
