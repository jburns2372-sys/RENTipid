import { PrismaClient, SocialAttributionStatus } from '@prisma/client';
import { SocialAnalyticsService } from '../../src/lib/social/social-analytics-service';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();
const generateId = (length: number) => randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);

describe('Phase 10 - Social Analytics & Attribution Module', () => {
  let mockCampaignId: string;
  let mockPostId: string;
  let mockAccountId: string;
  let mockUserId: string;
  let mockListingId: string;
  let mockBookingId: string;
  let mockFailedBookingId: string;
  let mockPaymentId: string;
  let mockFailedPaymentId: string;
  let mockCategoryId: string;
  
  beforeAll(async () => {
    // Setup test data
    mockUserId = generateId(25);
    mockCategoryId = generateId(25);
    await prisma.user.create({
      data: {
        id: mockUserId,
        email: `analytics_tester_${Date.now()}@example.com`,
        full_name: 'Test Analytics',
        account_type: 'RENTER',
        role: 'USER',
        status: 'ACTIVE'
      }
    });

    mockCampaignId = generateId(25);
    await prisma.marketingCampaign.create({
      data: {
        id: mockCampaignId,
        created_by_id: mockUserId,
        campaign_name: 'P10 Test Campaign',
        campaign_type: 'PROMO',
        campaign_goal: 'BOOKINGS',
        campaign_status: 'ACTIVE',
        approval_status: 'APPROVED',
        budget_placeholder: 500.00
      }
    });

    mockAccountId = generateId(25);
    await prisma.socialAccount.create({
      data: {
        id: mockAccountId,
        account_name: 'Mock Account',
        platform: 'FACEBOOK',
        account_handle: '@mock',
        account_type: 'PAGE',
        connection_status: 'CONNECTED'
      }
    });

    mockPostId = generateId(25);
    await prisma.marketingPost.create({
      data: {
        id: mockPostId,
        campaign_id: mockCampaignId,
        created_by_id: mockUserId,
        target_account_id: mockAccountId,
        platform: 'FACEBOOK',
        post_type: 'IMAGE',
        post_status: 'PUBLISHED',
        approval_status: 'APPROVED'
      }
    });

    await prisma.category.create({
      data: {
        id: mockCategoryId,
        name: 'Test Category',
        slug: 'test-category-' + mockCategoryId,
        risk_level: 'LOW'
      }
    });

    mockListingId = generateId(25);
    await prisma.listing.create({
      data: {
        id: mockListingId,
        title: 'Analytics Test Listing',
        description: 'Test',
        daily_rate: 100,
        location: '123 Test St',
        city: 'Testville',
        country: 'Testland',
        rental_type: 'ENTIRE_HOME',
        provider_id: mockUserId,
        category_id: mockCategoryId,
        status: 'PUBLISHED'
      }
    });

    mockBookingId = generateId(25);
    await prisma.booking.create({
      data: {
        id: mockBookingId,
        listing_id: mockListingId,
        renter_id: mockUserId,
        provider_id: mockUserId,
        status: 'CONFIRMED',
        start_date: new Date(),
        end_date: new Date(),
        rental_duration: 1,
        rental_duration_unit: 'DAYS',
        selected_rate_type: 'DAILY',
        base_rental_amount: 150,
        deposit_amount: 0,
        estimated_total_amount: 150,
        pickup_option: 'Pickup'
      }
    });

    mockPaymentId = generateId(25);
    await prisma.payment.create({
      data: {
        id: mockPaymentId,
        booking_id: mockBookingId,
        user_id: mockUserId,
        amount: 150.0,
        status: 'Completed',
        payment_method: 'Credit Card',
        type: 'Rental Payment'
      }
    });

    mockFailedBookingId = generateId(25);
    await prisma.booking.create({
      data: {
        id: mockFailedBookingId,
        listing_id: mockListingId,
        renter_id: mockUserId,
        provider_id: mockUserId,
        status: 'CONFIRMED',
        start_date: new Date(),
        end_date: new Date(),
        rental_duration: 1,
        rental_duration_unit: 'DAYS',
        selected_rate_type: 'DAILY',
        base_rental_amount: 150,
        deposit_amount: 0,
        estimated_total_amount: 150,
        pickup_option: 'Pickup'
      }
    });

    mockFailedPaymentId = generateId(25);
    await prisma.payment.create({
      data: {
        id: mockFailedPaymentId,
        booking_id: mockFailedBookingId,
        user_id: mockUserId,
        amount: 150.0,
        status: 'Failed',
        payment_method: 'Credit Card',
        type: 'Rental Payment'
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.socialAttribution.deleteMany({ where: { campaign_id: mockCampaignId } });
    await prisma.socialMetric.deleteMany({ where: { campaign_id: mockCampaignId } });
    const paymentIds = [mockPaymentId, mockFailedPaymentId].filter(Boolean);
    if (paymentIds.length > 0) {
      await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } });
    }
    const policies = await prisma.insurancePolicy.findMany({ where: { booking_id: mockBookingId } });
    if (policies.length > 0) {
      await prisma.insuranceClaim.deleteMany({ where: { policy_id: { in: policies.map(p => p.id) } } });
      await prisma.insurancePolicy.deleteMany({ where: { booking_id: mockBookingId } });
    }
    const selections = await prisma.insuranceSelection.findMany({ where: { booking_id: mockBookingId } });
    if (selections.length > 0) {
      await prisma.insuranceOrder.deleteMany({ where: { selection_id: { in: selections.map(s => s.id) } } });
      await prisma.insuranceSelection.deleteMany({ where: { booking_id: mockBookingId } });
    }
    const bookingIds = [mockBookingId, mockFailedBookingId].filter(Boolean);
    if (bookingIds.length > 0) {
      await prisma.paymentActionLog.deleteMany({ where: { booking_id: { in: bookingIds } } });
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    await prisma.campaignListingLink.deleteMany({ where: { listing_id: mockListingId } });
    await prisma.listing.deleteMany({ where: { id: mockListingId } });
    await prisma.category.deleteMany({ where: { id: mockCategoryId } });
    await prisma.marketingPost.deleteMany({ where: { id: mockPostId } });
    await prisma.socialAccount.deleteMany({ where: { id: mockAccountId } });
    await prisma.marketingCampaign.deleteMany({ where: { id: mockCampaignId } });
    await prisma.user.deleteMany({ where: { id: mockUserId } });
  });

  it('1. valid SocialMetric ingestion', async () => {
    const res = await SocialAnalyticsService.recordMetrics({
      provider: 'MOCK',
      social_account_id: mockAccountId,
      campaign_id: mockCampaignId,
      post_id: mockPostId,
      metric_type: 'IMPRESSIONS',
      metric_value: 1500,
      measurement_timestamp: new Date('2026-08-13T10:00:00Z')
    });
    expect(res.success).toBe(true);
    expect(res.duplicated).toBe(false);
    expect(res.metric).toBeDefined();
    expect(res.metric.metric_value).toBe(1500);
  });

  it('2. repeated metric payload deduplicated', async () => {
    const res = await SocialAnalyticsService.recordMetrics({
      provider: 'MOCK',
      social_account_id: mockAccountId,
      campaign_id: mockCampaignId,
      post_id: mockPostId,
      metric_type: 'IMPRESSIONS',
      metric_value: 1500,
      measurement_timestamp: new Date('2026-08-13T10:00:00Z')
    });
    expect(res.success).toBe(true);
    expect(res.duplicated).toBe(true);
  });

  it('3. valid click token tracked', async () => {
    const tracking = await SocialAnalyticsService.trackClick({
      source_channel: 'FACEBOOK',
      event_type: 'CLICK',
      campaign_id: mockCampaignId
    });
    expect(tracking.attribution_token).toBeDefined();
    expect(tracking.attribution_status).toBe('PENDING');
  });

  it('4. malformed token rejected', async () => {
    await expect(SocialAnalyticsService.trackClick({
      token: 'invalid_token_format',
      source_channel: 'FACEBOOK',
      event_type: 'CLICK'
    })).rejects.toThrow('Malformed tracking token');
  });

  it('6. Booking deterministically linked & 12. evidence upgrades attribution to CONFIRMED', async () => {
    const tracking = await SocialAnalyticsService.trackClick({
      source_channel: 'FACEBOOK',
      event_type: 'CLICK',
      campaign_id: mockCampaignId
    });

    const res = await SocialAnalyticsService.resolveAttribution({
      token: tracking.attribution_token!,
      event_type: 'BOOKING',
      entity_id: mockBookingId
    });

    expect(res).toBeDefined();
    expect(res?.attribution_status).toBe('CONFIRMED');
    expect(res?.booking_id).toBe(mockBookingId);
  });

  it('7. successful Payment linked', async () => {
    const tracking = await SocialAnalyticsService.trackClick({
      source_channel: 'FACEBOOK',
      event_type: 'CLICK',
      campaign_id: mockCampaignId
    });

    const res = await SocialAnalyticsService.resolveAttribution({
      token: tracking.attribution_token!,
      event_type: 'PAYMENT',
      entity_id: mockPaymentId
    });

    expect(res?.attribution_status).toBe('CONFIRMED');
    expect(res?.payment_transaction_id).toBe(mockPaymentId);
  });

  it('8. failed Payment not counted as conversion (stays UNCERTAIN)', async () => {
    const tracking = await SocialAnalyticsService.trackClick({
      source_channel: 'FACEBOOK',
      event_type: 'CLICK',
      campaign_id: mockCampaignId
    });

    const res = await SocialAnalyticsService.resolveAttribution({
      token: tracking.attribution_token!,
      event_type: 'PAYMENT',
      entity_id: mockFailedPaymentId
    });

    expect(res?.attribution_status).toBe('UNCERTAIN');
    expect(res?.confidence_score).toBe(0);
  });

  it('13. duplicate business outcome does not double-count', async () => {
    const tracking = await SocialAnalyticsService.trackClick({
      source_channel: 'FACEBOOK',
      event_type: 'CLICK',
      campaign_id: mockCampaignId
    });

    await SocialAnalyticsService.resolveAttribution({
      token: tracking.attribution_token!,
      event_type: 'BOOKING',
      entity_id: mockBookingId
    });

    const duplicateRes = await SocialAnalyticsService.resolveAttribution({
      token: tracking.attribution_token!,
      event_type: 'BOOKING',
      entity_id: mockBookingId
    });

    expect(duplicateRes?.attribution_status).toBe('CONFIRMED');
  });

  it('14. campaign metrics aggregate correctly & 15. confirmed revenue calculated correctly', async () => {
    const roiData = await SocialAnalyticsService.calculateCampaignROI(mockCampaignId);
    
    expect(roiData.metrics.impressions).toBe(1500); // from test 1
    expect(roiData.conversions.confirmed_bookings).toBe(2); // tests 6 and 13
    expect(roiData.conversions.confirmed_revenue).toBe(150.0); // test 7
    expect(roiData.conversions.uncertain_count).toBe(1); // test 8
  });

  it('16. ROI calculated only with valid campaign cost', async () => {
    const roiData = await SocialAnalyticsService.calculateCampaignROI(mockCampaignId);
    expect(roiData.financials.cost).toBe(500);
    expect(roiData.financials.roi).toBe(((150 - 500) / 500) * 100);
  });

  it('17. ROI returns UNAVAILABLE when cost missing', async () => {
    const noCostCampaignId = generateId(25);
    await prisma.marketingCampaign.create({
      data: {
        id: noCostCampaignId,
        created_by_id: mockUserId,
        campaign_name: 'No Cost Campaign',
        campaign_type: 'PROMO',
        campaign_goal: 'BOOKINGS',
        campaign_status: 'ACTIVE',
        approval_status: 'APPROVED',
        budget_placeholder: null
      }
    });

    const roiData = await SocialAnalyticsService.calculateCampaignROI(noCostCampaignId);
    expect(roiData.financials.cost).toBe('UNAVAILABLE');
    expect(roiData.financials.roi).toBe('UNAVAILABLE');

    await prisma.marketingCampaign.delete({ where: { id: noCostCampaignId } });
  });
});
