import {
  StructuredFactExtractor,
  PropertyTaxonomyMapper,
  AmenityTaxonomyMapper,
  ProhibitedDataFilter,
  CommercialPolicyClassifier,
  MappingConflictDetector,
  validateExtractionEnvelope,
} from '../../../src/lib/listingbridge';

describe('ListingBridge P5: Extraction & Normalization Core', () => {
  describe('Structured Fact Extraction', () => {
    const extractor = new StructuredFactExtractor();

    it('extracts candidate facts from structured JSON payload', () => {
      const envelope = validateExtractionEnvelope({
        importJobId: 'job-p5-test-01',
        providerId: 'provider-123',
        connectorId: 'airbnb-test-connector',
        connectorTier: 'TIER_1_OAUTH',
        sourceReferenceHash: 'hash-abc-1234567890123456',
        authorizationMethod: 'OAUTH_SERVER_SIDE',
        retrievedAt: new Date('2026-09-01T08:00:00Z'),
        contentType: 'application/json',
        payload: {
          title: 'Cozy Modern Studio in BGC',
          description: 'Spacious studio unit with fast wifi and city view.',
          property_type: 'Condominium',
          condition: 'Like New',
          location: {
            city: 'Taguig',
            province: 'Metro Manila',
            country: 'Philippines',
            latitude: 14.5547,
            longitude: 121.0478,
          },
          capacity: {
            quantity: 1,
            max_guests: 2,
            bedrooms: 1,
            bathrooms: 1,
            beds: 1,
          },
          amenities: ['Fast WiFi', 'Air conditioning', 'Swimming Pool', 'Kitchen'],
          pricing: {
            daily_rate: 2500,
            security_deposit: 5000,
            currency: 'PHP',
          },
          rules: {
            min_nights: 2,
            max_nights: 30,
            house_rules: 'No smoking. No loud noise after 10PM.',
          },
          media: [
            { url: 'https://cdn.example.com/photos/living.jpg', isCover: true, order: 1 },
            { url: 'https://cdn.example.com/photos/bed.jpg', isCover: false, order: 2 },
          ],
        },
      });

      const facts = extractor.extract(envelope);

      expect(facts.title?.rawValue).toBe('Cozy Modern Studio in BGC');
      expect(facts.description?.rawValue).toContain('Spacious studio');
      expect(facts.propertyType?.rawValue).toBe('Condominium');
      expect(facts.condition?.rawValue).toBe('Like New');
      expect(facts.location.city?.rawValue).toBe('Taguig');
      expect(facts.capacity.maxGuests?.rawValue).toBe(2);
      expect(facts.amenities.length).toBe(4);
      expect(facts.pricingHints.dailyRate?.rawValue).toBe(2500);
      expect(facts.rules.minDuration?.rawValue).toBe(2);
      expect(facts.media.length).toBe(2);
      expect(facts.rawPayloadHash).toBeDefined();
    });

    it('handles malformed or string payload safely without crashing', () => {
      const envelope = validateExtractionEnvelope({
        importJobId: 'job-p5-test-02',
        providerId: 'provider-123',
        connectorId: 'raw-connector',
        connectorTier: 'TIER_5_MANUAL',
        sourceReferenceHash: 'hash-def-1234567890123456',
        authorizationMethod: 'NONE',
        retrievedAt: new Date(),
        contentType: 'text/plain',
        payload: '{ invalid json payload',
      });

      const facts = extractor.extract(envelope);
      expect(facts.title).toBeUndefined();
      expect(facts.amenities).toEqual([]);
      expect(facts.rawPayloadHash).toBeDefined();
    });
  });

  describe('Property Taxonomy Mapping (LB-MAP-004)', () => {
    const mapper = new PropertyTaxonomyMapper();

    it('maps known property aliases deterministically to canonical taxonomy (HIGH_CONFIDENCE)', () => {
      const res1 = mapper.normalizePropertyType('condominium');
      expect(res1.canonicalCategorySlug).toBe('condominiums');
      expect(res1.confidence).toBe('HIGH_CONFIDENCE');
      expect(res1.requiresReview).toBe(false);

      const res2 = mapper.normalizePropertyType('Apartment');
      expect(res2.canonicalCategorySlug).toBe('condominiums');
      expect(res2.confidence).toBe('HIGH_CONFIDENCE');

      const res3 = mapper.normalizePropertyType('private room');
      expect(res3.canonicalCategorySlug).toBe('rooms');
      expect(res3.confidence).toBe('HIGH_CONFIDENCE');

      const res4 = mapper.normalizePropertyType('Beach Resort Villa');
      expect(res4.canonicalCategorySlug).toBe('beach-resorts');
      expect(res4.confidence).toBe('HIGH_CONFIDENCE');
    });

    it('flags ambiguous property types as REVIEW_RECOMMENDED', () => {
      const res = mapper.normalizePropertyType('house');
      expect(res.canonicalCategorySlug).toBe('other');
      expect(res.confidence).toBe('REVIEW_RECOMMENDED');
      expect(res.requiresReview).toBe(true);
      expect(res.reasonCode).toBe('PROPERTY_TYPE_AMBIGUOUS');
    });

    it('handles missing or empty property type as MISSING', () => {
      const res = mapper.normalizePropertyType('');
      expect(res.confidence).toBe('MISSING');
      expect(res.reasonCode).toBe('PROPERTY_TYPE_MISSING');
    });
  });

  describe('Amenity Taxonomy Mapping (LB-MAP-003)', () => {
    const mapper = new AmenityTaxonomyMapper();

    it('maps synonyms to canonical taxonomy and eliminates duplicates', () => {
      const raw = ['wifi', 'wi-fi', 'fast wireless internet', 'air conditioning', 'a/c', 'pool', 'swimming pool'];
      const result = mapper.normalizeAmenities(raw);

      expect(result.canonicalAmenities).toContain('WiFi');
      expect(result.canonicalAmenities).toContain('Air Conditioning');
      expect(result.canonicalAmenities).toContain('Swimming Pool');
      // No duplicate 'WiFi' or 'Air Conditioning'
      expect(result.canonicalAmenities.filter((a) => a === 'WiFi').length).toBe(1);
      expect(result.unmappedAmenities).toEqual([]);
    });

    it('retains unmapped amenities as unmapped without inventing taxonomy IDs', () => {
      const raw = ['WiFi', 'Custom Telescope for Stargazing'];
      const result = mapper.normalizeAmenities(raw);

      expect(result.canonicalAmenities).toContain('WiFi');
      expect(result.canonicalAmenities).not.toContain('Custom Telescope for Stargazing');
      expect(result.unmappedAmenities).toContain('Custom Telescope for Stargazing');
    });
  });

  describe('Prohibited Data Filtering (LB-MAP-005)', () => {
    const filter = new ProhibitedDataFilter();

    it('filters out guest PII, payment info, ratings, reviews, and credentials', () => {
      const payload = {
        title: 'Luxury Villa',
        credit_card: '4111-2222-3333-4444',
        cvv: '123',
        guest_messages: 'Hi host, can we check in at 10am?',
        guest_name: 'John Doe',
        reviews: [{ score: 5, comment: 'Great place' }],
        superhost: true,
        access_token: 'secret_token_abc',
      };

      const result = filter.filter(payload);

      expect(result.hasProhibitedContent).toBe(true);
      expect(result.cleanPayload.title).toBe('Luxury Villa');
      expect(result.cleanPayload.credit_card).toBeUndefined();
      expect(result.cleanPayload.guest_messages).toBeUndefined();
      expect(result.cleanPayload.reviews).toBeUndefined();
      expect(result.cleanPayload.access_token).toBeUndefined();

      expect(result.prohibitedDetections.map((d) => d.classification)).toContain('PAYMENT_CREDENTIAL');
      expect(result.prohibitedDetections.map((d) => d.classification)).toContain('GUEST_PII');
      expect(result.prohibitedDetections.map((d) => d.classification)).toContain('REPUTATION_REVIEW');
      expect(result.prohibitedDetections.map((d) => d.classification)).toContain('AUTH_SECRET');
    });
  });

  describe('Commercial & Policy Classification', () => {
    const classifier = new CommercialPolicyClassifier();

    it('classifies pricing and policies as REVIEW_RECOMMENDED hints', () => {
      const pricing = {
        dailyRate: { sourceField: 'price', rawValue: 3500, valueHash: 'h1' },
        securityDeposit: { sourceField: 'deposit', rawValue: 5000, valueHash: 'h2' },
        currency: { sourceField: 'currency', rawValue: 'PHP', valueHash: 'h3' },
      };
      const rules = {
        minDuration: { sourceField: 'min_nights', rawValue: 2, valueHash: 'h4' },
        deliveryFee: { sourceField: 'delivery_fee', rawValue: 200, valueHash: 'h5' },
      };

      const result = classifier.classify(pricing, rules);

      expect(result.pricingHints.dailyRate).toBe(3500);
      expect(result.pricingHints.securityDeposit).toBe(5000);
      expect(result.ruleHints.minDuration).toBe(2);
      expect(result.ruleHints.deliveryFee).toBe(200);

      const dailyClass = result.classifications.find((c) => c.fieldName === 'pricingHints.dailyRate');
      expect(dailyClass?.confidence).toBe('REVIEW_RECOMMENDED');
      expect(dailyClass?.requiresReview).toBe(true);
    });

    it('flags absurd/negative prices as CONFLICT', () => {
      const pricing = {
        dailyRate: { sourceField: 'price', rawValue: -100, valueHash: 'h1' },
      };
      const result = classifier.classify(pricing, {});
      const dailyClass = result.classifications.find((c) => c.fieldName === 'pricingHints.dailyRate');
      expect(dailyClass?.confidence).toBe('CONFLICT');
      expect(dailyClass?.reasonCode).toBe('COMMERCIAL_PRICE_OUT_OF_BOUNDS');
    });
  });

  describe('Mapping Conflict Detection', () => {
    const detector = new MappingConflictDetector();

    it('detects min duration > max duration conflict', () => {
      const conflicts = detector.detectConflicts({
        minDuration: 10,
        maxDuration: 5,
      });

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].reasonCode).toBe('CONFLICT_MIN_GREATER_THAN_MAX_DURATION');
    });

    it('detects invalid coordinate bounds', () => {
      const conflicts = detector.detectConflicts({
        latitude: 95.0, // Invalid lat > 90
        longitude: 121.0,
      });

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].reasonCode).toBe('CONFLICT_LATITUDE_OUT_OF_RANGE');
    });

    it('detects invalid condition string', () => {
      const conflicts = detector.detectConflicts({
        condition: 'UnknownBrokenCondition',
      });

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].reasonCode).toBe('CONFLICT_INVALID_CONDITION_VALUE');
    });
  });
});
