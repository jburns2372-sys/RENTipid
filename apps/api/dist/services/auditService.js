"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditAction = void 0;
const client_1 = require("@prisma/client");
const appInsights = __importStar(require("applicationinsights"));
const prisma = new client_1.PrismaClient();
/**
 * Creates an immutable Audit Log record for high-risk system actions.
 * @param actorId - The user or system account performing the action
 * @param action - Structured action string (e.g., 'BOOKING_CREATED', 'PAYMENT_REFUNDED')
 * @param targetResource - The ID of the affected resource (e.g., bookingId)
 * @param details - JSON blob of old/new values or contextual context
 * @param correlationId - Propagated trace ID to link backend DB to frontend click
 */
const logAuditAction = async (actorId, action, targetResource, details, correlationId) => {
    try {
        // Phase 15: We assume there's an AuditLog table mapped in Prisma.
        // If it doesn't exist yet, it must be added to schema.prisma.
        // await prisma.auditLog.create({
        //   data: { actorId, action, targetResource, details, correlationId }
        // });
        // For now, we strictly emit this to AppInsights so it's queryable immediately.
        const client = appInsights.defaultClient;
        if (client) {
            client.trackEvent({
                name: `Audit_${action}`,
                properties: {
                    actorId,
                    targetResource,
                    correlationId,
                    ...details
                }
            });
        }
        console.log(`[AUDIT] ${action} executed by ${actorId} on ${targetResource}`);
    }
    catch (error) {
        // Never fail the primary transaction because the audit logger failed,
        // but flag it heavily in standard error logs.
        console.error('CRITICAL: Failed to write audit log', error);
    }
};
exports.logAuditAction = logAuditAction;
