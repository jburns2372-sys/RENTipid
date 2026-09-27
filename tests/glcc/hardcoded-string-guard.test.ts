/**
 * @jest-environment node
 */

import * as fs from 'fs';
import * as path from 'path';

describe('RENTipid GLCC v1.0.1 — Hard-Coded String Guard Test Suite', () => {
  const rootDir = path.resolve(__dirname, '../../');

  it('Super Admin Dashboard does not contain hard-coded card titles or descriptions', () => {
    const superAdminFile = path.join(rootDir, 'src/app/dashboard/super-admin/page.tsx');
    const content = fs.readFileSync(superAdminFile, 'utf-8');

    // Forbidden hard-coded strings in SuperAdmin page
    const forbiddenStrings = [
      'Super Admin Dashboard</h1>',
      'Live Payment Pilot</h2>',
      'Configure real-money checkout guardrails and monitor live test execution.</p>',
      'Finance Approvals</h2>',
      'Manage global settings for automatic vs manual deposit release and payouts.</p>',
      'Live Webhooks</h2>',
      'Real-time monitor for incoming PayMongo Live webhook events.</p>',
      'PayMongo Activation</h2>',
      'Track external KYC, payment method readiness, and webhook deployment.</p>',
      'Production Domain</h2>',
      'Validate HTTPS deployment, DNS, and URL paths for final release.</p>',
      'Security Operations Center</h2>',
      'Monitor security events, detection rules, advisory alerts, audit evidence and SOC review activity.</p>',
    ];

    for (const forbidden of forbiddenStrings) {
      expect(content).not.toContain(forbidden);
    }

    // Must contain canonical translation calls
    expect(content).toContain("t('superAdmin.title')");
    expect(content).toContain("t('superAdmin.livePaymentPilot.title')");
    expect(content).toContain("t('superAdmin.livePaymentPilot.description')");
    expect(content).toContain("t('superAdmin.financeApprovals.title')");
    expect(content).toContain("t('superAdmin.liveWebhooks.title')");
    expect(content).toContain("t('superAdmin.paymongoActivation.title')");
    expect(content).toContain("t('superAdmin.productionDomain.title')");
    expect(content).toContain("t('superAdmin.soc.title')");
  });

  it('Live Payment Status Banner does not contain raw English fallback strings', () => {
    const bannerFile = path.join(rootDir, 'src/components/finance/LivePaymentStatusBanner.tsx');
    const content = fs.readFileSync(bannerFile, 'utf-8');

    const forbiddenStrings = [
      'bannerMessage = "Live payment remains blocked. PayMongo approval is pending."',
      'bannerMessage = "Live payment remains blocked. Production HTTPS APP_BASE_URL is required."',
      'bannerMessage = "Live payment remains blocked. No PayMongo live payment method is active."',
      'bannerMessage = "Ready for one controlled live payment pilot. Finance review and emergency controls remain required."',
      'Phase 19B-C: Live Payment Pilot Status</h3>',
    ];

    for (const forbidden of forbiddenStrings) {
      expect(content).not.toContain(forbidden);
    }

    expect(content).toContain("t('superAdmin.banner.title')");
    expect(content).toContain("t('superAdmin.banner.blockedPayMongo')");
    expect(content).toContain("t('superAdmin.banner.blockedHttps')");
    expect(content).toContain("t('superAdmin.banner.blockedMethod')");
    expect(content).toContain("t('superAdmin.banner.ready')");
  });

  it('Global Preferences Modal uses dynamic localized copy dictionary', () => {
    const modalFile = path.join(rootDir, 'src/components/glcc/GlobalPreferencesModal.tsx');
    const content = fs.readFileSync(modalFile, 'utf-8');

    // Should derive copy dynamically based on activeUiLocale
    expect(content).toContain('getGlccCopy(activeUiLocale)');
    expect(content).toContain('copy.title');
    expect(content).toContain('copy.applyButton');
    expect(content).toContain('copy.cancelButton');
  });

  it('Provider Booking Detail Page uses GLCC canonical translations', () => {
    const file = path.join(rootDir, 'src/app/dashboard/provider/bookings/[id]/page.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    expect(content).not.toContain('<h1 className="text-3xl font-bold mb-2">Booking #');
    expect(content).toContain("t('renter.bookingDetail.bookingId'");
    expect(content).toContain("t('renter.bookingDetail.startDate'");
    expect(content).toContain("t('renter.bookingDetail.endDate'");
  });

  it('Provider Claim Status Page uses GLCC canonical translations', () => {
    const file = path.join(rootDir, 'src/app/dashboard/provider/bookings/[id]/claims/page.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    expect(content).not.toContain('<h1 className="text-3xl font-bold text-red-600">Damage Claim Status</h1>');
    expect(content).toContain("t('provider.damageClaimStatus')");
    expect(content).toContain("t('provider.trackTheResolutionOf')");
  });

  it('KYC Verification Page uses GLCC canonical translations', () => {
    const file = path.join(rootDir, 'src/app/dashboard/kyc/page.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    expect(content).not.toContain('<h1 className="text-3xl font-bold mb-2">Account Verification (KYC)</h1>');
    expect(content).toContain("t('kyc.accountVerificationKyc')");
    expect(content).toContain("t('kyc.submitRequiredDocumentsTo')");
  });

  it('Help Center Page uses GLCC canonical translations', () => {
    const file = path.join(rootDir, 'src/app/help/page.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    expect(content).not.toContain('<h1 className="text-3xl font-bold mb-2">How can I help you today?</h1>');
    expect(content).toContain("t('helpCenter.howCanIHelp')");
    expect(content).toContain("t('helpCenter.selectAQuestionChoose')");
  });

  it('Support Tickets Page uses GLCC canonical translations', () => {
    const file = path.join(rootDir, 'src/app/support/page.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    expect(content).not.toContain('<h1 className="text-3xl font-bold">Support Tickets</h1>');
    expect(content).toContain("t('support.supportTickets')");
    expect(content).toContain("t('support.needHelpOpenA')");
  });

  it('Admin Finance Page uses GLCC canonical translations', () => {
    const file = path.join(rootDir, 'src/app/dashboard/finance/page.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    expect(content).not.toContain('<h1 className="text-3xl font-bold">Finance Overview</h1>');
    expect(content).toContain("t('payment.financeOverview')");
    expect(content).toContain("t('payment.totalPlatformRevenue')");
  });

  it('Admin Dashboard Page uses GLCC canonical translations', () => {
    const file = path.join(rootDir, 'src/app/dashboard/admin/page.tsx');
    const content = fs.readFileSync(file, 'utf-8');

    expect(content).not.toContain('<h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>');
    expect(content).toContain("t('admin.adminDashboard')");
    expect(content).toContain("t('admin.listingReviewQueue')");
  });
});
