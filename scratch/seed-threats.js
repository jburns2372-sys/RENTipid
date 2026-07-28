const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const event = await prisma.securityEvent.create({
    data: {
      event_code: 'DUMMY_THREAT_DETECTED',
      source_type: 'AUDIT_LOG',
      source_record_id: 'dummy-123',
      security_domain: 'IDENTITY_AND_ACCESS',
      event_category: 'THREAT',
      event_classification: 'ATTACK_ATTEMPT',
      severity: 'CRITICAL',
      environment: 'PRODUCTION',
      lifecycle_type: 'LIVE',
      processing_status: 'PENDING',
      occurred_at: new Date(),
      source_received_at: new Date(),
      idempotency_key: 'seed-event-1',
      geo_enrichment: {
        create: {
          ip_fingerprint: 'dummy-hash',
          country_code: 'US',
          country_name: 'United States',
          city_name: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194,
          status: 'RESOLVED',
          provider: 'FIXTURE'
        }
      }
    }
  });
  console.log('Dummy event created:', event.id);
  
  const event2 = await prisma.securityEvent.create({
    data: {
      event_code: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      source_type: 'AUDIT_LOG',
      source_record_id: 'dummy-456',
      security_domain: 'IDENTITY_AND_ACCESS',
      event_category: 'THREAT',
      event_classification: 'ATTACK_ATTEMPT',
      severity: 'HIGH',
      environment: 'PRODUCTION',
      lifecycle_type: 'LIVE',
      processing_status: 'PENDING',
      occurred_at: new Date(),
      source_received_at: new Date(),
      idempotency_key: 'seed-event-2',
      geo_enrichment: {
        create: {
          ip_fingerprint: 'dummy-hash-2',
          country_code: 'CN',
          country_name: 'China',
          city_name: 'Beijing',
          latitude: 39.9042,
          longitude: 116.4074,
          status: 'RESOLVED',
          provider: 'FIXTURE'
        }
      }
    }
  });
  console.log('Dummy event 2 created:', event2.id);
  
  const event3 = await prisma.securityEvent.create({
    data: {
      event_code: 'BRUTE_FORCE_ATTEMPT',
      source_type: 'AUDIT_LOG',
      source_record_id: 'dummy-789',
      security_domain: 'IDENTITY_AND_ACCESS',
      event_category: 'THREAT',
      event_classification: 'ATTACK_ATTEMPT',
      severity: 'MEDIUM',
      environment: 'PRODUCTION',
      lifecycle_type: 'LIVE',
      processing_status: 'PENDING',
      occurred_at: new Date(),
      source_received_at: new Date(),
      idempotency_key: 'seed-event-3',
      geo_enrichment: {
        create: {
          ip_fingerprint: 'dummy-hash-3',
          country_code: 'RU',
          country_name: 'Russia',
          city_name: 'Moscow',
          latitude: 55.7558,
          longitude: 37.6173,
          status: 'RESOLVED',
          provider: 'FIXTURE'
        }
      }
    }
  });
  console.log('Dummy event 3 created:', event3.id);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
