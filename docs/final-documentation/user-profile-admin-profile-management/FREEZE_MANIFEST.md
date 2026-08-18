# FREEZE MANIFEST

**FEATURE:** User Profile and Admin Profile Management
**BRANCH:** feature/soc-phase4-threat-response
**FREEZE TIMESTAMP:** 2026-08-04T22:13:15.215Z

## FROZEN FILES

- src/app/api/profile/route.ts
  - SHA-256: f9cb2d6583d0c5271679663b29f877a480f6681a4aca31aa9137928114727a6a
- src/app/api/profile/photo/route.ts
  - SHA-256: 267c15eba6feaa0ab2a887dd753277d07a1df50e7f7a6a5649e14f7303cf110e
- src/app/api/profile/change-password/route.ts
  - SHA-256: c681377cc82f457ce79843c51461254c4460de4bf1f4a892fb946dc792868366
- src/app/dashboard/profile/page.tsx
  - SHA-256: b7be17ba24436a786a4375d991361f264f0be55504f981f6a02d858ba93c48ed
- src/components/profile/ProfileFormClient.tsx
  - SHA-256: 0476392b8368297bceb45148314ffb040a254c7da0a658b65d384a29264d0ada
- src/components/profile/ProfilePhotoUploadClient.tsx
  - SHA-256: cd1fdc8ee4f7785951c6719baa23fbf693cfd70a13615d3b3277a5c95e11d8af
- src/components/profile/ChangePasswordClient.tsx
  - SHA-256: 683fa2cbb212f04dc9e2ed1bfab03bb876cdbd7a8f483faf61f9223e0d325e8d
- src/app/api/admin/users/[userId]/profile/route.ts
  - SHA-256: 2912fbb804d01e2190b1c2599eb9e698bd19eb7f9c49e21598dbe37bac51b650
- src/app/dashboard/admin/users/page.tsx
  - SHA-256: e4fc4341c0cabcffeac7c10ea375a791676c27d674d99b5d2c135beaa768fa0b
- src/app/dashboard/admin/users/[userId]/page.tsx
  - SHA-256: 66c92e95ff9406d803fb3246f09a18ca7403e6d52754b600bd82378c4438df22
- src/components/admin/AdminProfileFormClient.tsx
  - SHA-256: dc2ce815b20a948f66955bfcdee06b3dd159c4659325756ab18cda5a9de1bfce
- src/components/layout/UserNavMenu.tsx
  - SHA-256: 70872d051ddd60f494d97b82f7b3fcc9bc0154edcaacc81c66711710057b6a3f

## ACCEPTED VALIDATION COMMANDS
- npm run lint
- npx tsc --noEmit
- npx cross-env NODE_ENV=test npx dotenv -e .env.test.local -e .env.test -- npx tsx scripts/test-profiles.ts

## KNOWN LIMITATIONS
- Existing legacy tests required field name updates to match the new Prisma schema.

## CONTROLLED REOPENING REQUIREMENT
Any modifications to the frozen files require a formal Controlled Change Request and re-execution of all validation gates.
