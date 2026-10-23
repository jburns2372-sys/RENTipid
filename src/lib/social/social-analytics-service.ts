import { PrismaClient, SocialAttributionStatus } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

export type MetricPayload = {
  provider: string;
  social_account_id: string;
  campaign_id?: string;
  post_id?: string;
  metric_type: string; // impressions, clicks, etc.
  metric_value: number;
  measurement_timestamp: Date;
  provider_timestamp?: Date;
  metadata?: any;
};

export type AttributionTrackingPayload = {
  token?: string;
  campaign_id?: string;
  post_id?: string;
  listing_id?: string;
  source_channel: string; 
  event_type: string; 
  metadata?: any;
};

export type BusinessOutcomePayload = {
  token: string;
  event_type: 'REGISTRATION' | 'BOOKING' | 'PAYMENT';
  entity_id: string; 
  metadata?: any;
};

export class SocialAnalyticsService {
  public static generateAttributionToken(): string {
    return `trk_${randomBytes(16).toString('hex')}`;
  }

  private static generateMetricHash(payload: MetricPayload): string {
    const raw = `${payload.provider}:${payload.social_account_id}:${payload.post_id || ''}:${payload.metric_type}:${payload.measurement_timestamp.toISOString().split('T')[0]}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  public static async recordMetrics(payload: MetricPayload) {
    const metricHash = this.generateMetricHash(payload);

    const existing = await prisma.socialMetric.findFirst({
      where: {
        provider: payload.provider,
        social_account_id: payload.social_account_id,
        metric_type: payload.metric_type,
        measurement_timestamp: payload.measurement_timestamp,
        post_id: payload.post_id || null
      }
    });

    if (existing) {
      return { success: true, duplicated: true, metric: existing };
    }

    const metric = await prisma.socialMetric.create({
      data: {
        provider: payload.provider,
        social_account_id: payload.social_account_id,
        campaign_id: payload.campaign_id || null,
        post_id: payload.post_id || null,
        metric_type: payload.metric_type,
        metric_value: payload.metric_value,
        measurement_timestamp: payload.measurement_timestamp,
        provider_timestamp: payload.provider_timestamp || null
      }
    });

    return { success: true, duplicated: false, metric };
  }

  public static async trackClick(payload: AttributionTrackingPayload) {
    const token = payload.token || this.generateAttributionToken();

    if (payload.token) {
       if (!payload.token.startsWith('trk_')) {
          throw new Error('Malformed tracking token');
       }
    }

    const attribution = await prisma.socialAttribution.create({
      data: {
        attribution_token: token,
        source_channel: payload.source_channel,
        event_type: payload.event_type,
        campaign_id: payload.campaign_id || null,
        post_id: payload.post_id || null,
        listing_id: payload.listing_id || null,
        occurred_at: new Date(),
        attribution_status: SocialAttributionStatus.PENDING,
        sanitized_metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      }
    });

    return attribution;
  }

  public static async resolveAttribution(payload: BusinessOutcomePayload) {
    const attribution = await prisma.socialAttribution.findUnique({
      where: { attribution_token: payload.token }
    });

    if (!attribution) {
      return null;
    }

    if (attribution.attribution_status === 'CONFIRMED') {
      return attribution;
    }

    let updateData: any = {
      attribution_status: SocialAttributionStatus.CONFIRMED,
      confidence_score: 100,
      attribution_method: 'DETERMINISTIC_TOKEN_MATCH'
    };

    if (payload.event_type === 'REGISTRATION') {
      const user = await prisma.user.findUnique({ where: { id: payload.entity_id } });
      if (!user) throw new Error('Invalid User ID for attribution resolution');
      updateData.user_id = user.id;
    } else if (payload.event_type === 'BOOKING') {
      const booking = await prisma.booking.findUnique({ where: { id: payload.entity_id } });
      if (!booking) throw new Error('Invalid Booking ID for attribution resolution');
      updateData.booking_id = booking.id;
    } else if (payload.event_type === 'PAYMENT') {
      const payment = await prisma.payment.findUnique({ where: { id: payload.entity_id } });
      if (!payment) throw new Error('Invalid Payment ID for attribution resolution');
      
      if (payment.status !== 'Completed' && payment.status !== 'SUCCESS') {
         updateData.attribution_status = SocialAttributionStatus.UNCERTAIN;
         updateData.confidence_score = 0;
      }
      updateData.payment_transaction_id = payment.id;
    }

    const updated = await prisma.socialAttribution.update({
      where: { id: attribution.id },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        action: 'ATTRIBUTION_RESOLVED',
        module: 'SocialAnalytics',
        target_id: updated.id,
        actor_user_id: null,
        details: JSON.stringify({ token: payload.token, event_type: payload.event_type, entity_id: payload.entity_id })
      }
    });

    return updated;
  }

  public static async calculateCampaignROI(campaignId: string) {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) throw new Error('Campaign not found');

    const metrics = await prisma.socialMetric.findMany({
      where: { campaign_id: campaignId }
    });

    const attributions = await prisma.socialAttribution.findMany({
      where: { campaign_id: campaignId },
      include: {
        payment: true
      }
    });

    let totalImpressions = 0;
    let totalClicks = 0;
    
    metrics.forEach(m => {
      if (m.metric_type === 'IMPRESSIONS') totalImpressions += m.metric_value;
      if (m.metric_type === 'CLICKS') totalClicks += m.metric_value;
    });

    const confirmedAttributions = attributions.filter(a => a.attribution_status === 'CONFIRMED');
    const uncertainAttributions = attributions.filter(a => a.attribution_status === 'UNCERTAIN');

    const confirmedBookings = confirmedAttributions.filter(a => !!a.booking_id).length;
    const confirmedRegistrations = confirmedAttributions.filter(a => !!a.user_id).length;
    
    let confirmedRevenue = 0;
    confirmedAttributions.forEach(a => {
      if (a.payment && (a.payment.status === 'Completed' || a.payment.status === 'SUCCESS')) {
        confirmedRevenue += a.payment.amount;
      }
    });

    const cost = campaign.budget_placeholder;
    let roi: number | 'UNAVAILABLE' = 'UNAVAILABLE';

    if (cost !== null && cost !== undefined && cost > 0) {
      roi = ((confirmedRevenue - cost) / cost) * 100;
    }

    return {
      campaign_id: campaignId,
      metrics: {
        impressions: totalImpressions,
        clicks: totalClicks,
      },
      conversions: {
        confirmed_bookings: confirmedBookings,
        confirmed_registrations: confirmedRegistrations,
        confirmed_revenue: confirmedRevenue,
        uncertain_count: uncertainAttributions.length
      },
      financials: {
        cost: cost ?? 'UNAVAILABLE',
        roi: roi
      }
    };
  }
}
