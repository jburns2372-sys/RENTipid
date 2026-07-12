# Migration Risk Register

## 1. SQLite Concurrency & Re-platforming
**Risk**: Rentipid currently uses SQLite. Moving to an Azure hybrid model with multiple Container Apps requires a concurrent relational database. 
**Mitigation**: Include a database engine migration (from SQLite to Azure Database for PostgreSQL Flexible Server) as a prerequisite to Phase 4 (Backend Separation).

## 2. Capacitor Mobile Integration
**Risk**: Rentipid integrates @capacitor/core for mobile apps. Shifting API endpoints to Azure (api.rentipid.com) requires updating mobile build configurations and handling CORS tightly.
**Mitigation**: Implement strict CORS policies on the Azure API Gateway and ensure the mobile app environment variables dynamically point to the new Azure API routes.

## 3. NextAuth Version 4 Session Handling
**Risk**: Rentipid uses NextAuth v4. Session verification on the Azure backend will require explicit JWT parsing.
**Mitigation**: Extract the NEXTAUTH_SECRET to Azure Key Vault and configure the Azure backend to decode and validate NextAuth JWTs natively.
