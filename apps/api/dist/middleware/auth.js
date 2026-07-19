"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Extracts and verifies NextAuth v4 JWT session token
const requireAuth = (req, res, next) => {
    const token = req.cookies?.['next-auth.session-token'] || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.NEXTAUTH_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};
exports.requireAuth = requireAuth;
