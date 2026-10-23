import { POST as autocompletePost } from '../../src/app/api/address/autocomplete/route';
import { POST as detailsPost } from '../../src/app/api/address/details/route';
import { AddressService } from '../../src/lib/address/AddressService';
import { AddressRateLimiter } from '../../src/lib/address/rate-limiter';
import { getServerSession } from 'next-auth/next';

jest.mock('next-auth/next');
jest.mock('../../src/lib/address/AddressService');
jest.mock('../../src/lib/address/rate-limiter');

describe('Address API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Autocomplete API', () => {
    it('should block unauthorized requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new Request('http://localhost/api/address/autocomplete', {
        method: 'POST',
        body: JSON.stringify({ input: '123' })
      });
      
      const res = await autocompletePost(req);
      expect(res.status).toBe(401);
    });

    it('should return 429 when rate limited', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } });
      (AddressRateLimiter.consumeAutocomplete as jest.Mock).mockResolvedValue(false);
      
      const req = new Request('http://localhost/api/address/autocomplete', {
        method: 'POST',
        body: JSON.stringify({ input: '123' })
      });
      
      const res = await autocompletePost(req);
      expect(res.status).toBe(429);
    });

    it('should return suggestions on success', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } });
      (AddressRateLimiter.consumeAutocomplete as jest.Mock).mockResolvedValue(true);
      (AddressService.searchAutocomplete as jest.Mock).mockResolvedValue({ status: 'OK', suggestions: [{ placeId: '1', mainText: '123' }] });
      
      const req = new Request('http://localhost/api/address/autocomplete', {
        method: 'POST',
        body: JSON.stringify({ input: '123', countryCode: 'US' })
      });
      
      const res = await autocompletePost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('OK');
      expect(json.suggestions.length).toBe(1);
    });
  });

  describe('Details API', () => {
    it('should block unauthorized requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new Request('http://localhost/api/address/details', {
        method: 'POST',
        body: JSON.stringify({ placeId: '1' })
      });
      
      const res = await detailsPost(req);
      expect(res.status).toBe(401);
    });

    it('should return 429 when rate limited', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } });
      (AddressRateLimiter.consumeDetails as jest.Mock).mockResolvedValue(false);
      
      const req = new Request('http://localhost/api/address/details', {
        method: 'POST',
        body: JSON.stringify({ placeId: '1' })
      });
      
      const res = await detailsPost(req);
      expect(res.status).toBe(429);
    });
    it('should return semantic failures (e.g. RATE_LIMITED) from provider as HTTP 429 payload', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user1' } });
      (AddressRateLimiter.consumeDetails as jest.Mock).mockResolvedValue(true);
      (AddressService.getDetails as jest.Mock).mockResolvedValue({ status: 'RATE_LIMITED', details: null });
      
      const req = new Request('http://localhost/api/address/details', {
        method: 'POST',
        body: JSON.stringify({ placeId: '1' })
      });
      
      const res = await detailsPost(req);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toBe('RATE_LIMITED');
    });
  });
});
