import { validateCheckoutRequestId, deriveCheckoutIdempotencyKey } from '../../src/app/checkout/[bookingId]/checkout-helpers';

describe('Checkout Helpers', () => {
  describe('validateCheckoutRequestId', () => {
    it('accepts a valid request ID', () => {
      const valid = '123e4567-e89b-12d3-a456-426614174000';
      expect(validateCheckoutRequestId(valid)).toBe(valid);
    });

    it('rejects missing or invalid types', () => {
      expect(() => validateCheckoutRequestId(undefined)).toThrow();
      expect(() => validateCheckoutRequestId(null)).toThrow();
      expect(() => validateCheckoutRequestId('')).toThrow();
      expect(() => validateCheckoutRequestId(123)).toThrow();
    });

    it('rejects malformed request IDs', () => {
      expect(() => validateCheckoutRequestId('not-a-uuid')).toThrow();
    });

    it('rejects oversized request IDs', () => {
      const oversized = 'a'.repeat(65);
      expect(() => validateCheckoutRequestId(oversized)).toThrow();
    });

    it('rejects whitespace-modified request IDs', () => {
      const valid = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => validateCheckoutRequestId(` ${valid} `)).toThrow();
      expect(() => validateCheckoutRequestId(`${valid}\n`)).toThrow();
    });
  });

  describe('deriveCheckoutIdempotencyKey', () => {
    it('generates the same key for the same inputs', () => {
      const key1 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      const key2 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      expect(key1).toBe(key2);
    });

    it('generates a different key for a different request ID', () => {
      const key1 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      const key2 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-2');
      expect(key1).not.toBe(key2);
    });

    it('generates a different key for a different booking ID', () => {
      const key1 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      const key2 = deriveCheckoutIdempotencyKey('user-1', 'booking-2', 'req-1');
      expect(key1).not.toBe(key2);
    });

    it('generates a different key for a different user ID', () => {
      const key1 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      const key2 = deriveCheckoutIdempotencyKey('user-2', 'booking-1', 'req-1');
      expect(key1).not.toBe(key2);
    });
  });
});
