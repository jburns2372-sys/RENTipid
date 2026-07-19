import rateLimit from 'express-rate-limit';
import { logApiSecurityEvent } from 'rentipid/src/lib/security/events/writers/api-security-writer';

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
  handler: (req, res, next, options) => {
    logApiSecurityEvent({
      event_code: 'API_RATE_LIMIT_EXCEEDED',
      outcome: 'DENIED',
      raw_ip: req.ip || req.socket.remoteAddress,
      safe_route_family: req.baseUrl + req.route?.path,
      http_method: req.method,
      threshold_category: 'GENERAL_100PM',
      sanitized_metadata: { limit: options.max, windowMs: options.windowMs }
    });
    res.status(options.statusCode).send(options.message);
  }
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
  handler: (req, res, next, options) => {
    logApiSecurityEvent({
      event_code: 'API_RATE_LIMIT_EXCEEDED',
      outcome: 'DENIED',
      raw_ip: req.ip || req.socket.remoteAddress,
      safe_route_family: req.baseUrl + req.route?.path,
      http_method: req.method,
      threshold_category: 'STRICT_5PM',
      sanitized_metadata: { limit: options.max, windowMs: options.windowMs }
    });
    res.status(options.statusCode).send(options.message);
  }
});