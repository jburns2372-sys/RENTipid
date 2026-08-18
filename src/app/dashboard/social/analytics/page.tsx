import React from 'react';
import { PrismaClient } from '@prisma/client';
import { SocialAnalyticsService } from '../../../../lib/social/social-analytics-service';

const prisma = new PrismaClient();

export default async function AnalyticsDashboardPage() {
  // Fetch active campaigns for selection
  const campaigns = await prisma.marketingCampaign.findMany({
    orderBy: { created_at: 'desc' }
  });

  // Calculate ROI for each campaign
  const roiDataList = await Promise.all(campaigns.map(async c => {
    try {
      const roi = await SocialAnalyticsService.calculateCampaignROI(c.id);
      return { campaign: c, analytics: roi };
    } catch (e) {
      return { campaign: c, analytics: null };
    }
  }));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Social Analytics & Attribution</h1>
      
      <div className="space-y-8">
        {roiDataList.map(({ campaign, analytics }) => (
          <div key={campaign.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">{campaign.campaign_name}</h2>
            <div className="text-sm text-gray-500 mb-6">Type: {campaign.campaign_type} | Goal: {campaign.campaign_goal}</div>
            
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Social Metrics */}
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <h3 className="font-semibold text-blue-800 mb-3">Top of Funnel</h3>
                  <div className="space-y-2 text-sm text-blue-900">
                    <div className="flex justify-between">
                      <span>Impressions:</span>
                      <span className="font-mono">{analytics.metrics.impressions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clicks:</span>
                      <span className="font-mono">{analytics.metrics.clicks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Business Outcomes */}
                <div className="bg-green-50 p-4 rounded-md border border-green-100">
                  <h3 className="font-semibold text-green-800 mb-3">Confirmed Conversions</h3>
                  <div className="space-y-2 text-sm text-green-900">
                    <div className="flex justify-between">
                      <span>Registrations:</span>
                      <span className="font-mono">{analytics.conversions.confirmed_registrations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bookings:</span>
                      <span className="font-mono">{analytics.conversions.confirmed_bookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-mono">${analytics.conversions.confirmed_revenue.toFixed(2)}</span>
                    </div>
                  </div>
                  {analytics.conversions.uncertain_count > 0 && (
                     <div className="mt-4 pt-3 border-t border-green-200 text-xs text-green-700">
                        {analytics.conversions.uncertain_count} Uncertain / Pending Attributions
                     </div>
                  )}
                </div>

                {/* ROI */}
                <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                  <h3 className="font-semibold text-purple-800 mb-3">Financial ROI</h3>
                  <div className="space-y-2 text-sm text-purple-900">
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span className="font-mono">
                        {analytics.financials.cost === 'UNAVAILABLE' 
                          ? 'UNAVAILABLE' 
                          : `$${Number(analytics.financials.cost).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>ROI:</span>
                      <span className="font-mono">
                        {analytics.financials.roi === 'UNAVAILABLE'
                          ? 'UNAVAILABLE'
                          : `${Number(analytics.financials.roi).toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">Analytics currently unavailable for this campaign.</div>
            )}
          </div>
        ))}

        {roiDataList.length === 0 && (
          <div className="text-gray-500 text-center py-12 bg-gray-50 rounded-lg">
            No campaigns found.
          </div>
        )}
      </div>
    </div>
  );
}
