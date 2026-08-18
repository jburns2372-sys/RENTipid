# Address Migration Review

## Summary
The migration `20260809000000_add_global_address` introduces the canonical Global Address System persistence layer.

## Database Target
- Tables created: `Address`
- Columns added: `global_address_id` in `UserProfile`, `global_business_address_id` in `BusinessProfile`
- Indexes added: Unique constraints for foreign keys.
- Constraints added: Foreign keys linking Profile relations to `Address.id`.

## Safety Affirmations
- **NO columns removed**
- **NO tables removed**
- **NO legacy fields removed**
- Production command is compatible with `prisma migrate deploy`
- Additive schema SQL validated on isolated copy of database

## Procedures
- **Pre-deployment**: Take snapshot/backup of database.
- **Verification**: Ensure no dropped rows in legacy tables post-deploy by running row counts. 
- **Recovery**: If failed, `migrate resolve --rolled-back` and drop `Address` table / constraints manually via SQL if necessary.
