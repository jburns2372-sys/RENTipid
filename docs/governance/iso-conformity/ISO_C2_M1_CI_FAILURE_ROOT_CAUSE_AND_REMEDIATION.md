# ISO-C2-M1-E3 — CI failure root cause and bounded remediation

Project RENTIPID-ISO-CONFORMITY-001 / v1.0. Executor Codex. Authoritative baseline 0063ae08a577f88c89213e0342704e509d7a3858; CI activation 98494bf8cc17dd9bb798bb6deb06065d81079035. Recorded 2026-10-21T19:31:38.079Z.

**STATUS: BLOCKED — unchanged security audit policy still FAILS.** Safe partial remediation is implemented and validated except security acceptance. No checkpoint commits or push: Task 12 expressly conditions them on local remediation validation passing. No main protection/status-check change, merge, deployment, tag, freeze or next wave.

## 1. Actual failed-job root causes

| Workflow | Job | Failed command | Actual error | Affected package/fixture | Root cause / remediation class |
|---|---|---|---|---|---|
| [Security Supply Chain Validation run 39658807274](https://github.com/jburns2372-sys/RENTipid/actions/runs/39658807274) | supply-chain-validation, job 119426091625 | node scripts/security/check-ci-audit.cjs | policy pass false; 65 total, 3 critical, 28 high, 34 moderate; exit 1 | 65 audited package entries and inherited chains | Genuine dependency vulnerabilities; security remediation, not suppression/runtime setup error. npm ci and Node setup passed. |
| [GLCC Localization Quality Gate run 39658807135](https://github.com/jburns2372-sys/RENTipid/actions/runs/39658807135) | Localization Acceptance CI, job 119426091424 | npm run test:glcc:ci -> cross-env NODE_ENV=test tsx scripts/run-glcc-ci.ts | fil-PH expected QA_REQUIRED, actual PRODUCTION_READY; ja-JP expected REGISTERED, actual PRODUCTION_READY | P9 pre-P11 runner versus later accepted production catalogs | F/E: historical test-harness/frozen baseline mismatch; accepted P11/global activation supersedes old expectations. Not proof of a functional regression. |
| GLCC same run/job | same | same | three literal Country / Operating Jurisdiction labels in register, register/individual and register/business | historical P5/P9 UI scan versus later GLOBAL-MKT registration surface | G: later application scope versus historical scanner; labels are real scan findings, not falsely dismissed as translated. E3 does not localize them or claim whole-platform zero hardcoded strings. |
| GLCC same run/job | same | Jest tests/glcc/ under global tests/setup.ts | DATABASE_SAFETY_GUARD_REJECTED_TARGET: ALLOW_TEST_DATABASE_MUTATION is not exactly true; 49 suites failed before execution, zero tests | DB guard attached globally to mixed historical/in-memory suites | F/B: environment/harness prerequisite mismatch, not 49 proved functional failures. Never set mutation permission or fabricate database credentials to bypass it. |

Both original failed-job logs were retrieved and inspected. Security failure is genuine fail-closed behavior; GLCC also propagates its failures. No local rerun was used to invent a different historical GitHub conclusion.

## 2. Audit evidence and classification method

Fresh npm audit --json reproduces all 65 package aggregate entries and the original severity distribution. [Raw before audit](evidence/iso-c2-m1-e3-audit-before.json), [raw after audit](evidence/iso-c2-m1-e3-audit-after.json), and [full per-finding classification](evidence/iso-c2-m1-e3-dependency-classification.json) retain each advisory/source/range, direct/transitive status, production/development/shared scope, every installation path, version and shortest declared path from every direct root (including installed optional/peer relationships). All nodes have traced root paths. The before versions are the frozen lock versions installed by successful GitHub npm ci; after versions were installed by a fresh isolated npm ci. A peer edge is a compatibility relationship, not proof of runtime import.

Registry npm view <package> versions --json metadata was obtained for all 82 distinct before/after package names. Patched-version cells identify the earliest newer published stable package version outside the npm aggregate range, not a blanket compatibility guarantee. Inherited entries may require a parent replacement; npm suggestions to downgrade Next lint to 14.x, Jest to 25.x or shadcn to 1.x were not accepted as safe fixes. YES for a safe fix means the bounded candidate actually clears that original package entry; remaining fixes are not assumed safe from fixAvailable alone. No upstream fix means a reachable vulnerable leaf has no published stable version outside its range. Full root paths, raw recommendations and caveats are in the structured classification.

65 is not a count of unique CVEs. We consolidate string-via propagation into **23 connected vulnerable dependency components**; separate installed physical paths remain in JSON. There are five remaining components after remediation. **49 original package entries clear; 17 additional propagated aggregates are now reported, giving 33 remaining entries, not a claim of 49 independent advisories fixed.** Newly reported aggregates are mainly the inherited sprintf-js/Jest chain plus @shadcn/registry; they are not hidden.

### Every original audit entry (65 rows)

| Package | Severity | Directness / scope | Locked/installed versions | Vulnerable range | Newer patched package version | Safe fix proven in candidate | Major/breaking required | No upstream leaf fix |
|---|---|---|---|---|---|---|---|---|
| @azure/monitor-opentelemetry | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 1.18.1 | <=1.19.0 | 1.20.0 | YES | NO | NO |
| @azure/monitor-opentelemetry-exporter | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 1.0.0-beta.42 | <=1.0.0-beta.42 | NONE | YES | NO | NO |
| @grpc/grpc-js | high | TRANSITIVE / PRODUCTION_OR_SHARED | 1.14.4 | 1.14.0 - 1.14.4 | 1.14.5 | YES | NO | NO |
| @modelcontextprotocol/sdk | high | TRANSITIVE / PRODUCTION_OR_SHARED | 1.29.0 | <=1.31.0 | 1.32.0 | YES | NO | NO |
| @next/eslint-plugin-next | high | TRANSITIVE / DEVELOPMENT | 16.2.12 | >=14.3.0-canary.0 | NONE | NO | NO | YES |
| @opentelemetry/configuration | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/core | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 2.7.1 | <2.8.0 | 2.8.0 | YES | NO | NO |
| @opentelemetry/exporter-logs-otlp-grpc | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-logs-otlp-http | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-logs-otlp-proto | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-metrics-otlp-grpc | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-metrics-otlp-http | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-metrics-otlp-proto | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-prometheus | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-trace-otlp-grpc | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-trace-otlp-http | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-trace-otlp-proto | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/exporter-zipkin | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 2.7.1 | <=2.7.1 | 2.8.0 | YES | NO | NO |
| @opentelemetry/instrumentation-http | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.16.0 // 0.19.1-alpha.7 - 0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/instrumentation-mysql | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.63.0 | <0.67.0 | 0.67.0 | YES | NO | NO |
| @opentelemetry/instrumentation-pg | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.69.0 | <0.73.0 | 0.73.0 | YES | NO | NO |
| @opentelemetry/otlp-exporter-base | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/otlp-grpc-exporter-base | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/otlp-transformer | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/propagator-b3 | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 2.7.1 | 0.19.1-alpha.11 - 2.7.1 | 2.8.0 | YES | NO | NO |
| @opentelemetry/propagator-jaeger | high | TRANSITIVE / PRODUCTION_OR_SHARED | 2.7.1 | <=2.8.0 | 2.9.0 | YES | NO | NO |
| @opentelemetry/resources | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 2.7.1 | 0.8.0 - 2.7.1 | 2.8.0 | YES | NO | NO |
| @opentelemetry/sdk-logs | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.218.0 | 0.219.0 | YES | NO | NO |
| @opentelemetry/sdk-metrics | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 2.7.1 | <=2.7.1 | 2.8.0 | YES | NO | NO |
| @opentelemetry/sdk-node | high | TRANSITIVE / PRODUCTION_OR_SHARED | 0.218.0 | <=0.219.0 | 0.220.0 | YES | NO | NO |
| @opentelemetry/sdk-trace-base | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 2.7.1 | <=2.7.1 | 2.8.0 | YES | NO | NO |
| @opentelemetry/sdk-trace-node | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 2.7.1 | <=2.7.1 | 2.8.0 | YES | NO | NO |
| @prisma/config | high | TRANSITIVE / DEVELOPMENT | 6.19.3 | 6.13.0-dev.1 - 7.10.0 // 8.1.0-dev.1 - 8.1.0-dev.4 | 7.10.1 | NO | YES | NO |
| @ts-morph/common | high | TRANSITIVE / PRODUCTION_OR_SHARED | 0.27.0 | 0.2.0 - 0.24.0 // 0.26.0 - 0.27.0 | 0.28.0 | NO | NO | YES |
| @xmldom/xmldom | high | TRANSITIVE / DEVELOPMENT | 0.9.10 | 0.9.0-beta.1 - 0.9.11 | 0.9.12 | YES | NO | NO |
| applicationinsights | moderate | DIRECT / PRODUCTION_OR_SHARED | 3.15.1 | 3.0.0-beta.0 - 3.15.1 | 3.16.0 | YES | NO | NO |
| argparse | moderate | TRANSITIVE / DEVELOPMENT | 1.0.10 | 1.0.0 - 1.0.10 | 2.0.0 | NO | NO | YES |
| baseline-browser-mapping | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 2.10.42 | >=2.0.0 <2.11.0 | 2.11.0 | YES | NO | NO |
| brace-expansion | high | TRANSITIVE / DEVELOPMENT + PRODUCTION_OR_SHARED | 2.1.2, 5.0.8, 1.1.16 | <=1.1.20 // 2.0.0 - 2.1.6 // 4.0.0 - 5.0.11 | 1.1.21 | YES | NO | NO |
| braces | high | TRANSITIVE / PRODUCTION_OR_SHARED | 3.0.3 | * | NONE | NO | NO | YES |
| browserslist | high | TRANSITIVE / PRODUCTION_OR_SHARED | 4.28.4 | <=4.28.6 | 4.28.7 | YES | NO | NO |
| d3-color | high | TRANSITIVE / PRODUCTION_OR_SHARED | 2.0.0 | 1.0.2 - 3.0.1 | 3.1.0 | NO | YES | NO |
| deepmerge-ts | high | TRANSITIVE / DEVELOPMENT | 7.1.5 | <8.0.0 | 8.0.0 | NO | YES | NO |
| eslint-config-next | high | DIRECT / DEVELOPMENT | 16.2.12 | >=14.3.0-canary.0 | NONE | NO | NO | YES |
| fast-glob | high | TRANSITIVE / PRODUCTION_OR_SHARED + DEVELOPMENT | 3.3.3, 3.3.1 | * | NONE | NO | NO | YES |
| fast-uri | high | TRANSITIVE / PRODUCTION_OR_SHARED | 3.1.4 | 3.0.0 - 3.1.7 | 3.1.8 | YES | NO | NO |
| handlebars | critical | TRANSITIVE / DEVELOPMENT | 4.7.9 | 3.0.0 - 4.7.9 | 4.7.10 | YES | NO | NO |
| hono | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 4.12.27 | <=4.13.10 | 4.13.11 | YES | NO | NO |
| ip-address | high | TRANSITIVE / PRODUCTION_OR_SHARED | 10.2.0 | <=10.7.0 | 10.7.1 | YES | NO | NO |
| js-yaml | high | TRANSITIVE / DEVELOPMENT + PRODUCTION_OR_SHARED | 3.15.0, 4.3.0 | 3.0.0 - 4.3.1 | 4.3.2 | NO | NO | YES |
| micromatch | high | TRANSITIVE / PRODUCTION_OR_SHARED | 4.0.8 | >=0.2.0 | NONE | NO | NO | YES |
| nanoid | high | TRANSITIVE / PRODUCTION_OR_SHARED | 3.3.16 | <3.3.18 | 3.3.18 | YES | NO | NO |
| next | critical | DIRECT / PRODUCTION_OR_SHARED | 16.2.12 | 9.3.4-canary.0 - 16.3.7 | 16.3.8 | YES | NO | NO |
| nodemailer | high | DIRECT / PRODUCTION_OR_SHARED | 7.0.7 | <=10.0.5 | 10.0.6 | NO | YES | NO |
| postcss | high | TRANSITIVE / PRODUCTION_OR_SHARED | 8.4.31 | <=8.5.22 | 8.5.23 | YES | NO | NO |
| postcss-selector-parser | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 7.1.4 | <7.1.6 | 7.1.6 | YES | NO | NO |
| prisma | high | DIRECT / DEVELOPMENT | 6.19.3 | 6.13.0-dev.1 - 7.10.0 // 8.0.0-rc.3 - 8.1.0-dev.4 | 7.10.1 | NO | YES | NO |
| proxy-addr | critical | TRANSITIVE / PRODUCTION_OR_SHARED | 2.0.7 | 1.1.0 - 2.0.7 | 2.0.8 | YES | NO | NO |
| qs | moderate | TRANSITIVE / PRODUCTION_OR_SHARED | 6.15.3 | 2.2.5 - 6.15.3 | 6.16.0 | YES | NO | NO |
| shadcn | high | DIRECT / PRODUCTION_OR_SHARED | 4.15.0 | <=0.0.0-rc-20261007105214 // >=2.0.0 | NONE | NO | NO | YES |
| sharp | high | TRANSITIVE / PRODUCTION_OR_SHARED | 0.34.5 | <=0.35.5-rc.1 | 0.35.5 | YES | NO | NO |
| source-map-js | high | TRANSITIVE / PRODUCTION_OR_SHARED | 1.2.1 | 1.0.0 - 1.2.1 | 1.2.2 | YES | NO | NO |
| sprintf-js | moderate | TRANSITIVE / DEVELOPMENT | 1.0.3 | * | NONE | NO | NO | YES |
| ts-morph | high | TRANSITIVE / PRODUCTION_OR_SHARED | 26.0.0 | 6.0.1 - 23.0.0 // 25.0.0 - 26.0.0 | 27.0.0 | NO | NO | YES |
| undici | high | TRANSITIVE / PRODUCTION_OR_SHARED | 6.28.0, 7.28.0 | <=6.28.0 // 7.0.0 - 7.29.0 | 6.28.1 | YES | NO | NO |

### Consolidated original vulnerable components (23)

| Chain | Package entries | Connected packages |
|---|---|---|
| C01 | 30 | @azure/monitor-opentelemetry, @azure/monitor-opentelemetry-exporter, @opentelemetry/configuration, @opentelemetry/core, @opentelemetry/exporter-logs-otlp-grpc, @opentelemetry/exporter-logs-otlp-http, @opentelemetry/exporter-logs-otlp-proto, @opentelemetry/exporter-metrics-otlp-grpc, @opentelemetry/exporter-metrics-otlp-http, @opentelemetry/exporter-metrics-otlp-proto, @opentelemetry/exporter-prometheus, @opentelemetry/exporter-trace-otlp-grpc, @opentelemetry/exporter-trace-otlp-http, @opentelemetry/exporter-trace-otlp-proto, @opentelemetry/exporter-zipkin, @opentelemetry/instrumentation-http, @opentelemetry/instrumentation-mysql, @opentelemetry/instrumentation-pg, @opentelemetry/otlp-exporter-base, @opentelemetry/otlp-grpc-exporter-base, @opentelemetry/otlp-transformer, @opentelemetry/propagator-b3, @opentelemetry/propagator-jaeger, @opentelemetry/resources, @opentelemetry/sdk-logs, @opentelemetry/sdk-metrics, @opentelemetry/sdk-node, @opentelemetry/sdk-trace-base, @opentelemetry/sdk-trace-node, applicationinsights |
| C02 | 1 | @grpc/grpc-js |
| C03 | 1 | @modelcontextprotocol/sdk |
| C04 | 8 | @next/eslint-plugin-next, @ts-morph/common, braces, eslint-config-next, fast-glob, micromatch, shadcn, ts-morph |
| C05 | 3 | @prisma/config, deepmerge-ts, prisma |
| C06 | 1 | @xmldom/xmldom |
| C07 | 3 | argparse, js-yaml, sprintf-js |
| C08 | 1 | baseline-browser-mapping |
| C09 | 1 | brace-expansion |
| C10 | 1 | browserslist |
| C11 | 1 | d3-color |
| C12 | 1 | fast-uri |
| C13 | 1 | handlebars |
| C14 | 1 | hono |
| C15 | 1 | ip-address |
| C16 | 1 | nanoid |
| C17 | 3 | next, postcss, sharp |
| C18 | 1 | nodemailer |
| C19 | 1 | postcss-selector-parser |
| C20 | 1 | proxy-addr |
| C21 | 1 | qs |
| C22 | 1 | source-map-js |
| C23 | 1 | undici |

### Every remaining audit entry (33 rows)

| Package | Severity | Directness / scope | Locked/installed versions | Vulnerable range | Newer patched package version | Safe fix proven in candidate | Major/breaking required | No upstream leaf fix |
|---|---|---|---|---|---|---|---|---|
| @istanbuljs/load-nyc-config | moderate | TRANSITIVE / DEVELOPMENT | 1.1.0 | * | NONE | NO | NO | YES |
| @jest/core | moderate | TRANSITIVE / DEVELOPMENT | 30.4.2 | >=25.1.0 | NONE | NO | NO | YES |
| @jest/expect | moderate | TRANSITIVE / DEVELOPMENT | 30.4.1 | * | NONE | NO | NO | YES |
| @jest/globals | moderate | TRANSITIVE / DEVELOPMENT | 30.4.1 | >=28.0.0-alpha.0 | NONE | NO | NO | YES |
| @jest/reporters | moderate | TRANSITIVE / DEVELOPMENT | 30.4.1 | >=25.1.0 | NONE | NO | NO | YES |
| @jest/transform | moderate | TRANSITIVE / DEVELOPMENT | 30.4.1 | >=25.1.0 | NONE | NO | NO | YES |
| @next/eslint-plugin-next | high | TRANSITIVE / DEVELOPMENT | 16.3.8 | >=14.3.0-canary.0 | NONE | NO | NO | YES |
| @prisma/config | high | TRANSITIVE / DEVELOPMENT | 6.19.3 | 6.13.0-dev.1 - 7.10.0 // 8.1.0-dev.1 - 8.1.0-dev.4 | 7.10.1 | NO | YES | NO |
| @shadcn/registry | high | TRANSITIVE / PRODUCTION_OR_SHARED | 0.2.0 | <=0.0.0-rc-20261007105214 // >=0.1.0 | NONE | NO | NO | YES |
| @ts-morph/common | high | TRANSITIVE / PRODUCTION_OR_SHARED | 0.27.0 | 0.2.0 - 0.24.0 // 0.26.0 - 0.27.0 | 0.28.0 | NO | NO | YES |
| argparse | moderate | TRANSITIVE / DEVELOPMENT | 1.0.10 | 1.0.0 - 1.0.10 | 2.0.0 | NO | NO | YES |
| babel-jest | moderate | TRANSITIVE / DEVELOPMENT | 30.4.1 | >=25.1.0 | NONE | NO | NO | YES |
| babel-plugin-istanbul | moderate | TRANSITIVE / DEVELOPMENT | 7.0.1 | >=6.0.0-beta.0 | NONE | NO | NO | YES |
| braces | high | TRANSITIVE / PRODUCTION_OR_SHARED | 3.0.3 | * | NONE | NO | NO | YES |
| d3-color | high | TRANSITIVE / PRODUCTION_OR_SHARED | 2.0.0 | 1.0.2 - 3.0.1 | 3.1.0 | NO | YES | NO |
| deepmerge-ts | high | TRANSITIVE / DEVELOPMENT | 7.1.5 | <8.0.0 | 8.0.0 | NO | YES | NO |
| eslint-config-next | high | DIRECT / DEVELOPMENT | 16.3.8 | >=14.3.0-canary.0 | NONE | NO | NO | YES |
| fast-glob | high | TRANSITIVE / PRODUCTION_OR_SHARED + DEVELOPMENT | 3.3.3, 3.3.1 | * | NONE | NO | NO | YES |
| jest | moderate | DIRECT / DEVELOPMENT | 30.4.2 | >=25.1.0 | NONE | NO | NO | YES |
| jest-circus | moderate | TRANSITIVE / DEVELOPMENT | 30.4.2 | >=25.2.4 | NONE | NO | NO | YES |
| jest-cli | moderate | TRANSITIVE / DEVELOPMENT | 30.4.2 | >=25.1.0 | NONE | NO | NO | YES |
| jest-config | moderate | TRANSITIVE / DEVELOPMENT | 30.4.2 | >=25.1.0 | NONE | NO | NO | YES |
| jest-resolve-dependencies | moderate | TRANSITIVE / DEVELOPMENT | 30.4.2 | >=27.0.0-next.0 | NONE | NO | NO | YES |
| jest-runner | moderate | TRANSITIVE / DEVELOPMENT | 30.4.2 | >=25.1.0 | NONE | NO | NO | YES |
| jest-runtime | moderate | TRANSITIVE / DEVELOPMENT | 30.4.2 | >=25.1.0 | NONE | NO | NO | YES |
| jest-snapshot | moderate | TRANSITIVE / DEVELOPMENT | 30.4.1 | >=27.0.0-next.0 | NONE | NO | NO | YES |
| js-yaml | moderate | TRANSITIVE / DEVELOPMENT | 3.15.2 | 3.2.7 - 3.15.2 | 4.0.0 | NO | NO | YES |
| micromatch | high | TRANSITIVE / PRODUCTION_OR_SHARED | 4.0.8 | >=0.2.0 | NONE | NO | NO | YES |
| nodemailer | high | DIRECT / PRODUCTION_OR_SHARED | 7.0.7 | <=10.0.5 | 10.0.6 | NO | YES | NO |
| prisma | high | DIRECT / DEVELOPMENT | 6.19.3 | 6.13.0-dev.1 - 7.10.0 // 8.0.0-rc.3 - 8.1.0-dev.4 | 7.10.1 | NO | YES | NO |
| shadcn | high | DIRECT / PRODUCTION_OR_SHARED | 4.22.1 | <=0.0.0-rc-20261007105214 // >=2.0.0 | NONE | NO | NO | YES |
| sprintf-js | moderate | TRANSITIVE / DEVELOPMENT | 1.0.3 | * | NONE | NO | NO | YES |
| ts-morph | high | TRANSITIVE / PRODUCTION_OR_SHARED | 26.0.0 | 6.0.1 - 23.0.0 // 25.0.0 - 26.0.0 | 27.0.0 | NO | NO | YES |

## 3. Implemented safe dependency changes

Only package.json and package-lock.json change. Next 16.2.12 -> **16.3.8**, the minimum published 16.x release outside the complete observed Next advisory range; matching eslint-config-next 16.3.8; applicationinsights 3.15.1 -> **3.17.0**; existing shadcn ^4 range resolves 4.15.0 -> 4.22.1 through non-forced repair. No major framework/runtime upgrade, forced peer resolution, vulnerability-ignore flag or override added. NextAuth/Nodemailer and Prisma major upgrades were not forced. The repository's pre-existing legacy-peer-deps=true npm configuration was preserved, not introduced; an initial proposal without that file correctly hit the pre-existing React 19/react-simple-maps peer conflict, then resolution honored the existing contract.

In an isolated proposal, npm install --package-lock-only --ignore-scripts resolves the three explicitly changed direct version pins; npm audit fix --package-lock-only --ignore-scripts applies compatible repairs and returns nonzero for remaining vulnerabilities. No --force. 157 existing installation paths change version, including 144 production/shared paths; [version delta](evidence/iso-c2-m1-e3-version-delta.json) records all of them. This is runtime-coupled dependency remediation, not a harmless documentation-only delta. No application source file changes.

The accepted explicit policy remains byte-for-byte unchanged: development-family graph exceptions capped at 30 high and 4 moderate, zero critical/low/info exceptions, with runtime/shared and unrelated findings rejected. We did not invent a zero-moderate rule or reinterpret existing caps. Local unchanged gate result: exit 1, pass false, total 33, critical 0, high 14, moderate 19. Gate output rejected=15 is an implementation rejection indicator combining finding and ceiling checks, not a count of unique advisories.

## 4. Exact remaining security remediation blockers

- **braces 3.0.3, HIGH**: shadcn -> fast-glob -> micromatch -> braces; eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Latest published 3.0.3 is vulnerable; no patched upstream release. Its aggregate chains remain blocked. No existing audit exception is fabricated for this production/shared/Next-lint chain.
- **sprintf-js 1.0.3, MODERATE**: jest/ts-jest -> @jest/transform -> babel-plugin-istanbul -> @istanbuljs/load-nyc-config -> js-yaml -> argparse -> sprintf-js. Latest 1.1.3 also vulnerable. No patched published upstream version; 19 inherited moderate entries exceed the governed four-moderate cap. No new exception or downgrade of Jest to 25.
- **nodemailer 7.0.7, HIGH**: direct runtime dependency and NextAuth peer. Earliest newer secure version outside the full observed aggregate range is 10.0.6 (latest observed 10.2.0), but installed next-auth 4.24.15 declares nodemailer ^7.0.7. Secure major requires explicit compatibility work; no peer contract bypass/new auth architecture in E3.
- **deepmerge-ts 7.1.5, HIGH**: prisma -> @prisma/config -> deepmerge-ts. [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) requires >=8.0.0. Current Prisma 6.x parent contract uses 7.x; npm suggests Prisma 7.10.1. No unproven major leaf override or Prisma major migration. Prisma is tooling; its optional client peer edge does not prove a live application import.
- **d3-color 2.0.0, HIGH**: react-simple-maps -> d3-zoom -> d3-interpolate -> d3-color. [GHSA-36jr-mh4h-2g58](https://github.com/advisories/GHSA-36jr-mh4h-2g58) fixed in 3.1.0, a different major from the current parent contract. A map/D3 compatibility replacement needs focused approval/validation; no unsafe global override.

There are **three confirmed major/compatibility leaf chains** (Nodemailer, deepmerge-ts/Prisma, d3-color), plus **two no-upstream-fix chains** (braces and sprintf-js). Transitive status does not make them ignorable. Risk remains PARTIAL — REMEDIATION IN PROGRESS; no score reduction or residual acceptance.

## 5. Correct accepted GLCC CI boundary

Evidence for the later baseline: [P11 acceptance](../glcc-v1.0.1/RENTIPID_GLCC_P11_G11_ACCEPTED.md), [GLOBAL-W1 frozen release](../glcc-v1.1/global/GLOBAL_W1_FINAL_RELEASE_FREEZE_MANIFEST.json), and most specifically [accepted current GLCC reproduction command](../global-mkt-v2.0/BATCH2_X3_CODEX_PROVIDER_INTEGRATION_REVIEW.md#final-validation). The last explicitly validates scripts/test-glcc-targeted.ts against **46 countries / 47 languages / 25 display currencies**.

E3 points test:glcc:ci at exactly that existing accepted runner using NODE_ENV=test and node --import tsx. It is an in-memory catalog/policy regression runner, has no DB prerequisite and fails by thrown assertions. It passes 14 checks. The current corrective-localization suite additionally passes as part of the 104 targeted tests. Historical P9 runner/tests/evidence remain unchanged and available; their old phase-specific assertions are not silently rewritten to green. This narrower current-baseline command does not claim rerunning all historical phase suites or resolving the three later registration-label localization findings. It restores the accepted current CI reproduction path, not a blanket all-localization certification.

**GLCC FUNCTIONAL BASELINE: PASS — REUSED / UNAFFECTED** for the unchanged frozen functionality; no genuine GLCC functional defect is proven by the historical mismatch. **FROZEN GLCC MODULE REOPEN: NO.** Runtime dependency promotion still needs its own Preview/Production validation; unchanged GLCC source is not a new deployed-runtime acceptance.

## 6. Targeted local validation and actual impact

[Structured validation](evidence/iso-c2-m1-e3-local-validation.json) records command/exit results, candidate file hashes and local log hashes. Validation uses fresh npm ci --ignore-scripts under Node v24.22.0/npm 10.9.7 in an ignored full-source candidate with no .env files. Shared node_modules junction remains untouched; no Production/Preview credentials or services used. Prisma client generation only, no database connection or data operation.

| Check | Result |
|---|---|
| Unchanged security audit CLI | **FAIL**, exit 1; 0 critical / 14 high / 19 moderate |
| Corrected current GLCC CI-equivalent | PASS, 14 assertions |
| Affected M1 CI/Jest contracts | PASS, 23 checks; revalidated because dependency/parser/test-runner changes can invalidate these contracts |
| Targeted in-memory auth/upload/current-localization suites | PASS, 104 tests / 3 suites |
| sharp WebP resize / AVIF and telemetry import smoke | PASS; telemetry not started |
| Prisma client generation | PASS, no database operation |
| Next 16.3.8 webpack production build | PASS, exit 0; build only, no deployment |
| TypeScript tsc --noEmit | PASS, exit 0 |
| Local security acceptance | **FAIL**; no bypass/exception created |

Targeted Jest uses only a temporary candidate-local config for the three audited in-memory suites: reject any configured DB target, deny network/database access. The repository global DB guard and normal database-backed commands are untouched; no mutation allowance is granted. No unrelated provider/GLOBAL-MKT suites, migration, seed or remote acceptance rerun.

**Delta: C — RUNTIME DEPENDENCY CHANGE**, with additional CI script/development dependency changes. No application source or frozen localization content/behavior is edited, but runtime implementation versions and image/telemetry behavior can change. Code/local functional gates executed, not silently inherited. Preview and Production revalidation are REQUIRED before runtime promotion/closure, not performed or authorized here.

| Lifecycle gate | Disposition |
|---|---|
| codeComplete | PASS — EXECUTED |
| localFunctional | PASS — EXECUTED |
| localDatabaseMigrated | PASS — REUSED / UNAFFECTED |
| localRequiredDataSeededSynced | PASS — REUSED / UNAFFECTED |
| localAcceptancePass | FAIL |
| previewMigrated | PASS — REUSED / UNAFFECTED |
| previewAcceptancePass | BLOCKED |
| productionReady | BLOCKED |
| productionDeploymentVerification | BLOCKED |
| completed | BLOCKED |
| accepted | BLOCKED |
| closed | BLOCKED |
| versionFrozen | N/A — NOT APPLICABLE |

## 7. Checkpoint boundary and next action

The reviewed partial package/lock changes and evidence remain uncommitted and unpushed because security audit/local acceptance did not pass. Technical commit NONE; governance commit NONE; PUSH NOT_RUN. Main protections and deferred required checks unchanged. RSK-08 residual 3 x 4 = 12 HIGH unchanged and unaccepted. No operating-conformity claim, Preview/Production action, main merge, tag, freeze or next wave.

Next action: SECURITY REMEDIATION BLOCKER: resolve unpatched braces/sprintf-js chains and approve compatibility work for Nodemailer, Prisma/deepmerge-ts and d3-color before CI can pass.
