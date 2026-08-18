# SOC Phase 5: Slice 5A - Behavioral Risk Navigation Integration

## 1. Description
Added a permission-aware navigation entry for the SOC Phase 5 Behavioral Risk Investigation Dashboard to the single authoritative Security Dashboard Page layout. The link inherits existing UI conventions, applies exact URL mapping, and rigorously asserts `DASHBOARD_VIEW` permissions prior to visibility.

## 2. Files Modified
- **Modified:** `src/app/dashboard/admin/security/page.tsx`
  - Inserted the `Behavioral Risk` navigation link utilizing `SECURITY_PERMISSIONS.DASHBOARD_VIEW` and the predefined aesthetic constants (`px-4 py-2 text-slate-400 font-medium hover:text-blue-400`).

## 3. Files Created
- **Created:** `tests/security/intelligence/behavioral-risk.navigation.test.ts`
  - Created an isolated jsdom test that rigorously verifies existence, visibility, active state UI behaviors (checking for lack of the hardcoded `border-blue-500` active marker), lack of introduced mutation links, and authorization rendering requirements.

## 4. Verification Sign-Off
- **Test Target:** `npx jest tests/security/intelligence/behavioral-risk.navigation.test.ts --runInBand`
  - Result: `PASS`
- **Lint Target:** `npx eslint src/app/dashboard/admin/security/page.tsx tests/security/intelligence/behavioral-risk.navigation.test.ts`
  - Result: `PASS`
- **TypeScript Compilation:** `tsc --noEmit`
  - Result: `PASS` (Only pre-existing phase 3 errors detected).
- **Production Build:** `npm run build`
  - Result: `PASS`
- **Navigation Safety Checklist:**
  - Multi-file definition avoided: Yes (navigation strictly contained in single modified source file)
  - Navigation accurately gated by DASHBOARD_VIEW: Yes
  - Original SOC tabs left intact: Yes
  - Zero API or database dependencies inside layout: Yes

## 5. Artifact Output
The security dashboard successfully routes designated roles with `DASHBOARD_VIEW` privileges to the Behavioral Risk engine without imposing structural compromises on legacy SOC tabs. All objectives within Slice 5A have been satisfied.
