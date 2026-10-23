"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymongoSignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const verifyPaymongoSignature = (req, res, next) => {
    const signatureHeader = req.headers['paymongo-signature'];
    if (!signatureHeader) {
        return res.status(401).json({ error: 'Missing PayMongo signature' });
    }
    // Extract timestamp (t) and signature (te or v1)
    const parts = signatureHeader.split(',');
    const t = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const te = parts.find(p => p.startsWith('te='))?.split('=')[1] || parts.find(p => p.startsWith('v1='))?.split('=')[1];
    if (!t || !te) {
        return res.status(401).json({ error: 'Invalid PayMongo signature format' });
    }
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('PAYMONGO_WEBHOOK_SECRET is not configured');
        return res.status(500).json({ error: 'Webhook configuration error' });
    }
    // Reconstruct payload and hash
    // NOTE: This assumes req.body has NOT been parsed to JSON yet, or we have rawBody access.
    // For production, express.raw({type: 'application/json'}) is required before this middleware.
    const payload = `${t}.${req.rawBody || JSON.stringify(req.body)}`;
    const expectedSignature = crypto_1.default.createHmac('sha256', webhookSecret).update(payload).digest('hex');
    if (expectedSignature !== te) {
        return res.status(401).json({ error: 'Webhook signature verification failed' });
    }
    next();
};
exports.verifyPaymongoSignature = verifyPaymongoSignature;
