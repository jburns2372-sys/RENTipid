"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProvider = exports.isAdmin = exports.isComplianceAdmin = exports.isFinanceAdmin = exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: Missing user context' });
        }
        if (!allowedRoles.includes(req.user.role) && req.user.role !== 'Super Admin') {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Pre-configured strict roles
exports.isFinanceAdmin = (0, exports.requireRole)(['Finance Admin']);
exports.isComplianceAdmin = (0, exports.requireRole)(['Compliance Admin']);
exports.isAdmin = (0, exports.requireRole)(['Admin', 'Finance Admin', 'Compliance Admin']);
exports.isProvider = (0, exports.requireRole)(['Individual Provider', 'Business Provider']);
