# RENTipid — Known Limitations & Deferred Scope

**Release Tag:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Accepted Production SHA:** `d84854264447b7e2c5f521ebf88da31d22d7c066`  
**Date:** September 16, 2026  

---

## 1. Accepted Known Limitations

The following items are recognized and explicitly approved by the Product Owner as part of formal release acceptance:

### A. Progressive Web App (PWA) Offline Caching
- **Accepted Scope:**  
  The web application provides a valid web app manifest (`/manifest.json`), responsive viewports, and mobile install surface capability.
- **Outside Scope:**  
  Offline service-worker caching, background periodic synchronization, and full offline asset persistence are **OUTSIDE ACCEPTED PRODUCTION SCOPE**. The application requires active internet connectivity for authenticated transactions and real-time database operations.

### B. ListingBridge Decommissioning & Retirement
- **Accepted Scope:**  
  100% of listing creation is consolidated on the native manual listing flow (`/dashboard/provider/listings/new`).
- **Retired Scope:**  
  Third-party OTA connectors (Airbnb, Booking.com, Agoda, Facebook Marketplace, generic URL scraping) are retired from active runtime. Active platform connector count is permanently `0`. Requests to `/dashboard/provider/listings/import` are safely intercepted and redirected.

---

## 2. Deferred Scope (Future Successor Modules)

The following capabilities were not part of the September 2026 successor baseline and are deferred to future revisions under formal change requests:

1. **Native Native iOS / Android Binary Packaging:**  
   Capacitor configurations exist in the repository but native app store submission / signing pipelines are deferred.
2. **Third-Party OTA Partner API Certification:**  
   Direct official OAuth connectivity with foreign OTA platforms remains deferred per Owner directive.
3. **Advanced AI Voice Streaming / Full-Duplex Digital Human:**  
   The current AI runtime provides high-speed text-based conversational guidance, intent discovery, and RAG knowledge retrieval. Video-based real-time avatar animation remains an external / deferred capability.
