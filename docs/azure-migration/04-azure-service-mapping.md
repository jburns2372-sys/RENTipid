# Recommended Azure Service Mapping

| Current Vercel / Capacitor Component | Target Azure Service | Justification |
|---|---|---|
| Next.js API Routes (/api/*) | Azure Container Apps | Serverless scaling, deep VNet integration. |
| SQLite Database | Azure Database for PostgreSQL Flexible Server | Required transition from SQLite for concurrent backend scaling. |
| Vercel/Local File Storage | Azure Blob Storage | High availability for Listing images and KYC Verification Documents. |
| Scheduled Tasks (if any) | Azure Container Apps Jobs | Fully managed scheduled execution. |
| Background Workers (Mobile Push) | Azure Service Bus | Reliable message brokering for Push Notifications to Capacitor clients. |
| Vercel Environment Variables | Azure Key Vault | Hardware security modules, dynamic secret rotation. |
