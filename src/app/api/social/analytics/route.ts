import { NextResponse } from 'next/server';
import { SocialAnalyticsService } from '../../../../lib/social/social-analytics-service';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { action, payload } = data;

    if (action === 'TRACK_CLICK') {
      const result = await SocialAnalyticsService.trackClick(payload);
      return NextResponse.json({ success: true, attribution: result });
    }

    if (action === 'RECORD_METRIC') {
      // Basic security check: in a real environment this would require a provider HMAC or internal API key
      const result = await SocialAnalyticsService.recordMetrics(payload);
      return NextResponse.json(result);
    }

    if (action === 'RESOLVE_ATTRIBUTION') {
      // Basic security check: should be an internal microservice call
      const result = await SocialAnalyticsService.resolveAttribution(payload);
      return NextResponse.json({ success: true, attribution: result });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'Missing campaignId' }, { status: 400 });
    }

    const roiData = await SocialAnalyticsService.calculateCampaignROI(campaignId);
    return NextResponse.json({ success: true, data: roiData });

  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
