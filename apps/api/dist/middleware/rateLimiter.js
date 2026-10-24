"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Phase 15: General API Rate Limiting to prevent basic DoS attacks.
 * Limits IPs to 100 requests per minute.
 */
exports.generalLimiter = (0, express_rate_limit_1.default)({
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
exports.strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'Strict rate limit exceeded for sensitive action. Try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
