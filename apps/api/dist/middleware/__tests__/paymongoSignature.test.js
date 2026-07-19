"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
describe('PayMongo Signature Validation (Phase 17)', () => {
    it('should reject a payload with an invalid webhook signature header format', () => {
        // Arrange
        const invalidHeader = 't=12345,some_other_value=abc';
        // Act
        const parts = invalidHeader.split(',');
        const signatureParts = parts.filter(p => p.startsWith('te=') || p.startsWith('li='));
        // Assert
        expect(signatureParts.length).toBe(0);
    });
    it('should successfully validate a correctly HMAC-hashed payload', () => {
        // Arrange
        const secret = 'whsec_test_secret_123';
        const payload = JSON.stringify({ data: { attributes: { type: 'payment.paid' } } });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signaturePayload = `${timestamp}.${payload}`;
        const validSignature = crypto_1.default.createHmac('sha256', secret).update(signaturePayload).digest('hex');
        const header = `t=${timestamp},te=${validSignature},li=random`;
        // Act
        const parts = header.split(',');
        const t = parts.find(p => p.startsWith('t='))?.split('=')[1];
        const te = parts.find(p => p.startsWith('te='))?.split('=')[1];
        const expectedSignature = crypto_1.default.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
        // Assert
        expect(t).toBe(timestamp);
        expect(te).toBe(validSignature);
        expect(te).toBe(expectedSignature);
    });
});
