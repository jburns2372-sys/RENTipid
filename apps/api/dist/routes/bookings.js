"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const bookingService_1 = require("../services/bookingService");
const router = (0, express_1.Router)();
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { listingId, startDate, endDate, quantity } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const booking = await (0, bookingService_1.createBookingHold)(req.user.id, listingId, new Date(startDate), new Date(endDate), quantity || 1);
        res.status(201).json(booking);
    }
    catch (error) {
        // Prevent leaking internal DB errors, but return actionable conflict errors
        res.status(409).json({ error: error.message });
    }
});
exports.default = router;
