# ISO-C2-M1-E6-P1 React Simple Maps / React 19 remediation

Status: **PASS - MAP PEER BLOCKER RESOLVED**. Executor: CODEX. Date: 2026-10-22.
Branch: feat/iso-conformity-v1.0. Technical baseline: b91e90b304c7ac964223df41400f93ca863b6956. Governance baseline: aebeb6c5325bd486fcd3e95f8ade3c5babeeec58.

Initial branch/history matched; preserved E6 governance/evidence delta retained. No reset, clean, stash or discard.

## Official candidate and graph

Direct npm registry queries returned stable **5.0.5**. v3 React/react-dom peer: **^16.8.0 || 17.x || 18.x**. v5 peer: **^16.8.0 || 17.x || 18.x || 19.x**. v5 has no engines field. Clean acceptance uses Node 24.22.0 / npm 10.9.7.

| Package | Before | Candidate |
|---|---|---|
| react | 19.2.4 | 19.2.4 |
| react-dom | 19.2.4 | 19.2.4 |
| react-simple-maps | 3.0.0 | 5.0.5 |
| d3-color | 3.1.0 | 3.1.0 |
| d3-interpolate | 2.0.1 | 3.0.1 |
| d3-zoom | 2.0.0 | 3.0.0 |
| d3-geo | 2.0.2 | 3.1.1 |

Existing deepmerge-ts 8.0.0 and d3-color 3.1.0 overrides retained. All installed d3-color paths resolve to 3.1.0, including d3-interpolate and d3-zoom -> d3-transition. TopoJSON client remains 3.1.0. Removed obsolete @types/react-simple-maps 3.0.6; v5 supplies its own declarations.

Strict npm resolution also normalizes existing @opentelemetry/api 1.10.0 to 1.9.1: existing SDK peers require <1.10.0 and console instrumentation requires ^1.9.1. No new override/direct telemetry dependency. Module-load-only applicationinsights/OpenTelemetry smoke PASS, no telemetry started. Full version delta and fingerprints: evidence/iso-c2-m1-e6-p1-validation.json.

## Actual map usage and API compatibility

Only affected application component: src/components/security/dashboard/SocThreatMap.tsx.

| Used API | Actual-use classification |
|---|---|
| ComposableMap | SOURCE-COMPATIBLE: geoMercator, dimensions, SVG style |
| Geographies | SOURCE-COMPATIBLE: local world topology URL, render callback, rsmKey |
| Geography | MINOR SOURCE CHANGE REQUIRED: v3 state-keyed style removed |
| Marker | SOURCE-COMPATIBLE: coordinate tuples, SVG circles, click selection |
| ZoomableGroup | SOURCE-COMPATIBLE: center, zoom, maxZoom, onMoveEnd |
| Graticule | SOURCE-COMPATIBLE: stroke, strokeWidth |

Annotation, Line, Sphere unused. The only source edit replaces Geography default/hover/pressed style with CSS utilities preserving outline behavior, hover/focus fill #1e293b and active fill #0f172a. No UI redesign, auth/email change or architecture replacement.

Sources: [official v5 migration](https://www.react-simple-maps.io/docs/migrating-to-v5), [ComposableMap](https://www.react-simple-maps.io/docs/composable-map), [Geographies](https://www.react-simple-maps.io/docs/geographies), [Geography](https://www.react-simple-maps.io/docs/geography), [Marker](https://www.react-simple-maps.io/docs/marker), [ZoomableGroup](https://www.react-simple-maps.io/docs/zoomable-group), [Graticule](https://www.react-simple-maps.io/docs/graticule). Published package and lockfile also inspected.

## Validation

- Strict npm install --package-lock-only --ignore-scripts: PASS with npm_config_legacy_peer_deps=false. Initial npm shim used Node 22 and emitted engine warning; Node 24 clean installation is the runtime acceptance evidence.
- Clean npm ci: PASS under Node 24.22.0 with legacy peer mode false, in empty full-source .rentipid-sandbox/iso-c2-m1-e6-p1. No .env files copied; shared node_modules preserved. Historical repository .npmrc remains unchanged, explicitly overridden to false for acceptance. No force or legacy-peer-deps solution.
- All five required map/D3 npm ls commands PASS. npm ls --all exits 0, no missing/invalid peers. JSON also reports two extraneous optional WASM support nodes (@img/sharp-wasm32 and @emnapi/runtime), both already represented in the lock; this is not an invalid React peer. Full tree retained.
- Real component contract: **3/3 PASS**, zero skips. Real React 19/map package with bundled world topology; mocks only local fetch and jsdom SVG layout. Covers country paths, graticule, marker severity/selection, zoom buttons, drag pan, reset, empty and unauthorized states. Existing map tests concern backend provider fixtures or static SOC dashboard placeholders, so no unrelated provider suite rerun.
- Typecheck: initial failure because fresh install lacked generated Prisma declarations. Standard npm run build generated client 6.19.3, without database operations; one typecheck retry PASS.
- Normal npm run build: FAIL before application compilation. Turbopack selected parent worktree root, whose pre-existing node_modules junction points outside its root to sibling RENTipid. Candidate node_modules is an ordinary directory. Panic: Symlink [project]/node_modules is invalid, it points out of the filesystem root. Layout failure, not a map source failure. Raw failure retained; accepted baseline also used Webpack.
- Webpack production build: PASS, exit 0; all 79 static pages generated. Used the accepted baseline build path after the documented unrelated Turbopack root/junction failure. Generated CSS contains hover, focus and active fill selectors. No build configuration/source workaround was committed.

Tested package/lock/source/test match worktree bytes. Shared root node_modules remains historical; isolated candidate is the authoritative tested graph. No normal-build failure is suppressed.

## Audit impact

Full raw reports retained. Historical-config audit: 0 Critical / 10 High / 19 Moderate. Strict-peer audit: **0 Critical / 11 High / 20 Moderate** for BOTH original baseline and candidate; zero advisory package additions. Extra strict entries are next-auth High (existing Nodemailer propagation) and ts-jest Moderate (existing Jest coverage propagation). These are inherited configuration-dependent findings, not new map vulnerabilities.

Unmodified policy evaluator with strict graph: 0 Critical / 2 High / 0 Moderate effective, namely Nodemailer and its NextAuth aggregate. Existing braces/sprintf dispositions remain unchanged. No policy changes/exceptions. Overall M1 security acceptance remains BLOCKED pending separate E6 Nodemailer work.

## Lifecycle/checkpoint

CODE COMPLETE: PASS EXECUTED. LOCAL FUNCTIONAL: PASS EXECUTED for affected map delta. REACT-SIMPLE-MAPS PEER BLOCKER: RESOLVED. OVERALL M1 LOCAL ACCEPTANCE: BLOCKED - NODEMAILER E6 PENDING.

Database migrated and required data seeded/synced: PASS REUSED / UNAFFECTED. No database/schema/migration/seed/auth/mail/provider/GLCC validation repeated. Preview acceptance and Production verification REQUIRED LATER. No deployment, main merge, branch-protection change, tag, freeze or next wave. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS; residual risk not accepted.

Preserved E6 blocked evidence is historical and will be supplemented with this prerequisite result. Technical commit: b77b9404672583347cf43746af29f67da2a986bd. Governance commit: the commit containing this evidence, message governance(iso-conformity): record React map peer remediation evidence. Normal push follows both commits; its actual result is reported after execution.
