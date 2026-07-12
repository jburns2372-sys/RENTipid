import rateLimit from 'express-rate-limit';

/**
 * Phase 15: General API Rate Limiting to prevent basic DoS attacks.
 * Limits IPs to 100 requests per minute.
 */
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests from this IP, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict Limiter specifically for Bookings or Financial endpoints.
 * Limits IPs to 5 requests per minute.
 */
export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Strict rate limit exceeded for sensitive action. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});