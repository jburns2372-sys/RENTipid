# Initial Route Ownership Matrix

| Route Area | Current Owner | Temporary Migration Owner | Final Owner | Rewrite Rule |
|---|---|---|---|---|
| /api/auth/* | Vercel | Vercel | Vercel | None |
| /api/bookings/* | Vercel | Azure (Wave 3) | Azure | /api/bookings/* -> api.rentipid.com/bookings/* |
| /api/payments/* | Vercel | Azure (Wave 6) | Azure | /api/payments/* -> api.rentipid.com/payments/* |
| /api/admin/* | Vercel | Azure (Wave 8) | Azure | /api/admin/* -> api.rentipid.com/admin/* |
