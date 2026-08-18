import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { SecurityEventGeoEnrichmentService } from './security-event-geo-enrichment.service';

export interface BackfillOptions {
    dryRun?: boolean;
    batchSize?: number;
    maximumRecords?: number;
    environment?: string;
    lifecycle?: string;
    dateFrom?: Date;
    dateTo?: Date;
    retryFailed?: boolean;
}

export async function runGeolocationBackfill(options: BackfillOptions = {}) {
    const isProd = process.env.NODE_ENV === 'production';
    
    // Safety check constraints
    if (isProd && !options.dryRun) {
        throw new Error("Production backfill is not allowed under Phase 6A rules.");
    }

    const {
        dryRun = true,
        batchSize = 100,
        maximumRecords = 1000,
        environment,
        lifecycle,
        dateFrom,
        dateTo,
        retryFailed = false
    } = options;

    const whereClause: any = {
        // simulation_excluded_by_default=true, test_excluded_from_live_map=true
        environment: environment || { notIn: ['TEST', 'SIMULATION'] },
        lifecycle: lifecycle || 'LIVE'
    };

    if (dateFrom || dateTo) {
        whereClause.occurred_at = {};
        if (dateFrom) whereClause.occurred_at.gte = dateFrom;
        if (dateTo) whereClause.occurred_at.lte = dateTo;
    }

    // Identify events without enrichment or with failures if retryFailed is true
    if (!retryFailed) {
        whereClause.geo_enrichment = { is: null };
    } else {
        whereClause.OR = [
            { geo_enrichment: { is: null } },
            { geo_enrichment: { status: { in: ['UNRESOLVED', 'PROVIDER_ERROR'] } } }
        ];
    }

    const eligibleEvents = await prisma.securityEvent.findMany({
        where: whereClause,
        take: maximumRecords,
        select: { id: true },
        orderBy: { occurred_at: 'desc' }
    });

    console.log(`[GEO-BACKFILL] Found ${eligibleEvents.length} eligible records for backfill. DryRun=${dryRun}`);

    if (dryRun) {
        return { processed: 0, totalEligible: eligibleEvents.length, dryRun };
    }

    const service = new SecurityEventGeoEnrichmentService();
    let processed = 0;

    // Process in bounded batches
    for (let i = 0; i < eligibleEvents.length; i += batchSize) {
        const batch = eligibleEvents.slice(i, i + batchSize);
        const promises = batch.map(event => service.enrichEvent(event.id).catch(err => {
            console.error(`[GEO-BACKFILL] Failed to enrich event ${event.id}`, err);
        }));

        await Promise.allSettled(promises);
        processed += batch.length;
        console.log(`[GEO-BACKFILL] Processed batch ${i / batchSize + 1}. Total processed: ${processed}`);
    }

    return { processed, totalEligible: eligibleEvents.length, dryRun };
}
