import {
  ListingBridgeLocationIntelligenceService,
  DuplicatePropertyDetector,
} from '../../../src/lib/listingbridge';

describe('ListingBridge P6: Location & Duplicate Intelligence', () => {
  describe('Location & Geolocation Intelligence', () => {
    const locationService = new ListingBridgeLocationIntelligenceService();

    it('LB-LOC-001: Successfully normalizes address and validates Philippine geolocation', () => {
      const result = locationService.evaluate({
        rawLocationString: 'Unit 12A, Two Serendra, Bonifacio Global City',
        city: 'Taguig',
        province: 'Metro Manila',
        country: 'Philippines',
        postalCode: '1634',
        latitude: 14.5501,
        longitude: 121.0504,
      });

      expect(result.normalizedAddress.locality).toBe('Taguig');
      expect(result.normalizedAddress.administrativeArea1).toBe('Metro Manila');
      expect(result.normalizedAddress.countryCode).toBe('PH');
      expect(result.isWithinPhilippineBounds).toBe(true);
      expect(result.confidence).toBe('HIGH_CONFIDENCE');
      expect(result.conflicts.length).toBe(0);
      expect(result.requiresReview).toBe(false);
    });

    it('LB-LOC-002: Flags material address/coordinate conflict when coordinates are outside Philippines', () => {
      const result = locationService.evaluate({
        rawLocationString: 'Makati Avenue, Makati City',
        city: 'Makati',
        province: 'Metro Manila',
        country: 'Philippines',
        latitude: 51.5074, // London coordinates
        longitude: -0.1278,
      });

      expect(result.isWithinPhilippineBounds).toBe(false);
      expect(result.confidence).toBe('CONFLICT');
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].code).toBe('LOCATION_COORDINATES_COUNTRY_MISMATCH');
      expect(result.conflicts[0].severity).toBe('BLOCKING');
      expect(result.requiresReview).toBe(true);
    });

    it('Flags out-of-bounds or non-finite coordinate values as blocking conflict', () => {
      const result = locationService.evaluate({
        city: 'Cebu City',
        latitude: 120.0, // Invalid latitude > 90
        longitude: 123.8854,
      });

      expect(result.confidence).toBe('CONFLICT');
      expect(result.conflicts.some((c) => c.code === 'LOCATION_INVALID_LATITUDE')).toBe(true);
    });

    it('Assigns REVIEW_RECOMMENDED when coordinates are missing but address locality is provided', () => {
      const result = locationService.evaluate({
        city: 'Davao City',
        province: 'Davao del Sur',
        country: 'Philippines',
      });

      expect(result.normalizedAddress.locality).toBe('Davao City');
      expect(result.confidence).toBe('REVIEW_RECOMMENDED');
      expect(result.requiresReview).toBe(true);
      expect(result.conflicts.length).toBe(0);
    });
  });

  describe('Duplicate Property Intelligence', () => {
    const duplicateDetector = new DuplicatePropertyDetector();

    const existingListings = [
      {
        id: 'lst_existing_001',
        providerId: 'usr_prov_100',
        title: 'Studio Condo in Makati CBD with Pool',
        categoryId: 'condominiums',
        city: 'Makati',
        addressLine1: 'Ayala Avenue, Makati',
        latitude: 14.5547,
        longitude: 121.0244,
      },
      {
        id: 'lst_existing_002',
        providerId: 'usr_prov_200', // Different provider
        title: 'Beachfront Villa in Boracay Station 1',
        categoryId: 'beach-resorts',
        city: 'Malay',
        addressLine1: 'Station 1, Boracay',
        latitude: 11.9674,
        longitude: 121.9248,
      },
    ];

    const existingJobs = [
      {
        jobId: 'job_prev_001',
        providerId: 'usr_prov_100',
        sourceReferenceHash: 'hash-source-ref-100-airbnb',
        createdListingId: 'lst_existing_001',
      },
    ];

    it('LB-DEDUP-001 & LB-DEDUP-002: Detects EXACT_MATCH for previously imported source reference', () => {
      const result = duplicateDetector.detectDuplicates({
        providerId: 'usr_prov_100',
        sourceReferenceHash: 'hash-source-ref-100-airbnb',
        title: 'Studio Condo in Makati',
        city: 'Makati',
        existingJobs,
        existingListings,
      });

      expect(result.matchLevel).toBe('EXACT_MATCH');
      expect(result.confidenceScore).toBe(1.0);
      expect(result.matchedJobId).toBe('job_prev_001');
      expect(result.matchedListingId).toBe('lst_existing_001');
      expect(result.isBlocking).toBe(true);
      expect(result.signals.some((s) => s.code === 'SAME_SOURCE_REFERENCE')).toBe(true);
    });

    it('LB-DEDUP-002: Detects LIKELY_MATCH for spatial coordinate proximity under the same provider', () => {
      const result = duplicateDetector.detectDuplicates({
        providerId: 'usr_prov_100',
        sourceReferenceHash: 'hash-new-different-source',
        title: 'Modern Makati Studio Apartment',
        city: 'Makati',
        latitude: 14.5548, // ~15 meters from 14.5547
        longitude: 121.0245,
        existingJobs,
        existingListings,
      });

      expect(result.matchLevel).toBe('EXACT_MATCH');
      expect(result.matchedListingId).toBe('lst_existing_001');
      expect(result.signals.some((s) => s.code === 'COORDINATE_PROXIMITY')).toBe(true);
      expect(result.isBlocking).toBe(true);
    });

    it('LB-DEDUP-002: Detects POSSIBLE_MATCH for similar title in the same city with different provider', () => {
      const result = duplicateDetector.detectDuplicates({
        providerId: 'usr_prov_999', // Different provider
        sourceReferenceHash: 'hash-completely-new',
        title: 'Studio Condo in Makati CBD with Pool & Gym',
        city: 'Makati',
        existingJobs,
        existingListings,
      });

      expect(result.matchLevel).toBe('POSSIBLE_MATCH');
      expect(result.matchedListingId).toBe('lst_existing_001');
      expect(result.isBlocking).toBe(false);
      expect(result.requiresReview).toBe(true);
    });

    it('LB-DEDUP-003 & LB-DEDUP-004: Returns NO_MATCH when importing an unrelated new listing', () => {
      const result = duplicateDetector.detectDuplicates({
        providerId: 'usr_prov_300',
        sourceReferenceHash: 'hash-unrelated-source-ref',
        title: 'Warehouse Storage Space in Santa Rosa Laguna',
        city: 'Santa Rosa',
        latitude: 14.3121,
        longitude: 121.1114,
        existingJobs,
        existingListings,
      });

      expect(result.matchLevel).toBe('NO_MATCH');
      expect(result.confidenceScore).toBe(0.0);
      expect(result.matchedListingId).toBeUndefined();
      expect(result.isBlocking).toBe(false);
      expect(result.requiresReview).toBe(false);
    });
  });
});
