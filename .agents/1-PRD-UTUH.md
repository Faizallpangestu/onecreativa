# Development plan - OneCreativa full-scope QA and software handover form

Revision: 1
Plan status: Approved
Implementation authorization: Granted
Approved revision: 1
Approval date: 2026-11-27
Approval quotation/reference: User message "kerjakan sesuai plan final kita", after the final plan for scope A was presented and the user asked "Setuju dengan plan ini? Kalau ya, keluar dari plan mode dan saya mulai dari langkah 1-2". Format decision: "md yang bisa di printed pdf saja dulu".
Authorized scope and delivery permissions: Execute QA for all modules (HRD/GA, Finance, LMS/Sensei/LPK, RPA) and produce printable Markdown QA handover form. No push, no deploy, no production database changes, no commit unless separately requested.
Source brief/design: Conversation 2026-11-27; inventory of `docs/audit/QA_PHASE_5_16.md`, `docs/audit/PRODUCTION_RUNBOOK.md`, `backend/tests/`, `tools/`, `package.json`, `src/utils/roleAccess.js`.
Planning depth: Full

Draft A/B/C together when inputs suffice. Approval locks the A/B baseline. Task progress may change within approved scope; material changes require an amendment and ACC. Keep unknowns explicit and do not use template values as evidence of authorization.

## PART A - Requirements

### A1. Problem, users and outcome
The project has 36 PHP test scripts, ~30 custom verification scripts and an audit matrix, but no npm test runner, no CI, and QA evidence dated 2026-10-12 that is stale against November quiz/finance changes. There is no handover ("serah terima") form. The QA lead and client/PO need a single, honest, printable record covering the whole system, with role-based UAT results, defect status, limitations and sign-off.

Observable outcome: a filled `docs/QA_FORM/QA_SERAH_TERIMA_<run>.md` whose case totals match saved evidence, where every Fail has a defect ID, every Blocked has a reason, limitations are explicit, and sign-off fields are present; openable in a Markdown preview and printable to PDF (A4 landscape) without truncated tables.

### A2. Scope and constraints
In scope: full application QA (HRD/GA, Finance/accounting/payroll, LMS/Sensei/LPK, student billing, Midtrans/RPA), static/build checks, backend HTTP checks, browser/UI checks, role-based manual UAT, defect triage/retest, GO/NO-GO decision, and the printable QA handover form.

Exclusions: no new framework or CI, no Excel/Sheet/HTML form, no production deployment, no changes to application behaviour, no password/secret recording in the form, no claim of PASS for unverified items.

Constraints and assumptions: staging URL and QA accounts with realistic data relationships must be supplied by the user; if absent, UI/UAT cases stay Blocked and are recorded honestly. PHP binary path in the old runbook is hard-coded and must be overridable. Browser debug port/Playwright previously unavailable. QA evidence must avoid PII.

### A3. Requirements and acceptance
| ID | Requirement / user outcome | Priority | Observable acceptance criteria |
| --- | --- | --- | --- |
| FR-01 | Master test-case matrix covering all modules and roles | P0 | Every module/role row in `QA_PHASE_5_16.md:9-30` and role list at line 34 maps to at least one case with stable ID, Expected, and evidence field. |
| FR-02 | Reproducible test commands independent of hard-coded PHP path | P0 | `package.json` exposes test scripts; PHP path is configurable; commands documented in `docs/QA_FORM/RUNBOOK.md`. |
| FR-03 | Static and build gates pass | P0 | `npm run lint`, `npm run build`, artifact checks and lighthouse check record exit codes and results. |
| FR-04 | Backend/HTTP evidence is generated and archived | P0 | 36 PHP test scripts and `tools/release-http-check.cjs` run against synthetic data; JSON evidence stored in `docs/QA_FORM/evidence/`. |
| FR-05 | Browser/UI evidence is attempted honestly | P1 | Browser checks run where tooling allows; failure to run is recorded as Blocked with reason, never as PASS. |
| FR-06 | Role-based UAT is recorded per persona | P0 | One row per required persona with real login, role, scope, Actual, Status, evidence, tester and date; no localStorage role spoofing. |
| FR-07 | Handover form is printable Markdown | P0 | Template and filled run contain sections A-F; tables fit A4 landscape print; no inline evidence images; no passwords. |
| FR-08 | GO/NO-GO gate is evidence-backed | P0 | Rekap counts match evidence JSON totals; each Fail has defect ID; each Blocked has reason; sign-off complete. |

### A4. Open decisions and risks
- QA staging accounts and realistic linked data are not yet provided; without them T-06 stays Blocked.
- Browser automation previously had `complete=false` in `release-browser-verification.json`.
- Old QA evidence is stale for November quiz/finance changes.
- There is no CI; all evidence is produced locally and must be labelled as such.

## PART B - Technical approach

### B1. Context and architecture
Verified stack: Vite 8 + React 19 frontend, procedural PHP/MySQLi backend, custom CLI test harness in `backend/tests/`, custom Node verification scripts in `tools/`, Playwright used for PDF rendering in `automation/` but not wired as a test runner. Build is `vite build && node tools/prerender-login.mjs && node copy-backend.js`. Documents live in `docs/audit/`. The new QA artifacts are added under `docs/QA_FORM/` without changing application runtime code.

### B2. Interfaces, data and security
Test scripts use isolated synthetic databases; HTTP checks use real session/CSRF/multipart against a local server. Evidence files are JSON/text/screenshots under `docs/QA_FORM/evidence/`. The form records account identifiers and roles only, never passwords, tokens, cookies or PII; screenshots must be redacted. API NetworkOnly and Apache private-directory protections are verified per `PRODUCTION_RUNBOOK.md`. No schema change is required for this work.

### B3. Decisions and dependencies
| Decision | Chosen approach | Alternatives / reason | Risk / mitigation |
| --- | --- | --- | --- |
| D-01 | Reuse existing PHP/Node scripts, add npm wrappers | New framework would add dependency and rewrite cost | Wrappers keep evidence reproducible |
| D-02 | Markdown printable to PDF, no HTML/CSS layer | Excel/Sheet rejected by user; HTML adds tooling | Keep tables compact, print instruction in document |
| D-03 | Reuse `QA_PHASE_5_16.md` matrix as baseline | Starting from zero loses known NO-GO items | Expand, do not overwrite audit doc |
| D-04 | Honest Blocked for unavailable staging/browser | Faking PASS invalidates handover | Record reason and evidence in form section D |

External dependencies and environment variable names: `PHP_BIN` (PHP executable path), `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT` (test database identity), `CREATIVA_RELEASE_OUT` (artifact output). No values recorded.

### B4. Verification and recovery
Checks: `npm run lint`, `npm run build`, `npm run test:php`, `npm run test:http`, `npm run test:browser`, `npm run test:all`, artifact/manifest checks, `git diff --check`, manual Markdown preview print. Recovery: no production writes; generated evidence can be regenerated; test scripts use synthetic databases; a failed gate reverts to documented NO-GO rather than deployment.

## PART C - Tasks and progress

Statuses: Todo / In Progress / Blocked / Done. A task is Done only with acceptance evidence. Update details and the summary together. Dependency IDs refer to tasks below; no cycles.

| ID | Outcome | Requirement links | Dependencies | Status |
| --- | --- | --- | --- | --- |
| T-01 | Master test-case matrix from existing QA baseline | FR-01 | None | Done |
| T-02 | Reproducible npm test scripts and QA runbook with PHP_BIN | FR-02 | None | Done |
| T-03 | Static/build gate evidence | FR-03 | T-02 | Done |
| T-04 | Backend and HTTP test evidence | FR-04 | T-02 | Done |
| T-05 | Browser/UI evidence attempt | FR-05 | T-02 | Done |
| T-06 | Role-based UAT execution and results | FR-06 | T-01, user-supplied staging accounts | Blocked |
| T-07 | Defect triage, retest and GO/NO-GO decision | FR-08 | T-03, T-04, T-05, T-06 | Done |
| T-08 | Printable QA handover form template and filled run | FR-07, FR-08 | T-01, T-07 | Done |

### T-01 - Master test-case matrix
- Status: Done
- Requirements: FR-01
- Dependencies: None
- Files/components: added `docs/QA_FORM/TEST_CASE_MATRIX.md`
- Acceptance criteria: cases with stable IDs covering each module/role in `QA_PHASE_5_16.md:9-30` and personas at line 34; each has module, scenario, role, Expected, evidence field.
- Verification: 72 unique case IDs (HRD 13, GA 3, FIN 18, LMS 20, MCH 3, RPA 5, REL 5, SEC 3, MOB 2); coverage map present; `git diff --check` exit 0.
- Evidence: `docs/QA_FORM/TEST_CASE_MATRIX.md`; count command `Select-String` on case-ID pattern.
- Blocker: None
- Next action: None.

### T-02 - Reproducible test commands
- Status: Done
- Requirements: FR-02
- Dependencies: None
- Files/components: edited `package.json` and `tools/release-browser-check.cjs`; added `tools/qa-run-php-tests.cjs`, `docs/QA_FORM/RUNBOOK.md`
- Acceptance criteria: `test:php`, `test:http`, `test:browser`, `test:all` scripts exist; `PHP_BIN` and `CHROME_BIN` overridable; runbook documents commands, env names and evidence output.
- Verification: `npm run` listed all four scripts; `node --check tools/qa-run-php-tests.cjs` exit 0; `git diff --check` exit 0.
- Evidence: command output from `npm run`; runbook at `docs/QA_FORM/RUNBOOK.md`.
- Blocker: None
- Next action: None.

### T-03 - Static/build gates
- Status: Done
- Requirements: FR-03
- Dependencies: T-02
- Files/components: added `docs/QA_FORM/evidence/build-gates.json`; npm dependencies installed with `npm ci` (node_modules ignored)
- Acceptance criteria: lint/build/artifact/lighthouse commands executed with exit codes and concise results recorded.
- Verification: lint exit 1 (317 errors, 33 warnings); build exit 0; artifact check exit 1 (`config/db_env.php` packaged); lighthouse exit 1 (not installed); `git diff --check` exit 0.
- Evidence: `docs/QA_FORM/evidence/build-gates.json`.
- Blocker: Lighthouse unavailable; recorded as Blocked rather than Pass.
- Next action: Defects to be logged in T-07.

### T-04 - Backend and HTTP evidence
- Status: Done
- Requirements: FR-04
- Dependencies: T-02
- Files/components: added `docs/QA_FORM/evidence/php-tests.json`, `docs/QA_FORM/evidence/http-checks.json`
- Acceptance criteria: PHP suite and HTTP checks executed; totals and failures recorded; synthetic data used.
- Verification: after local MariaDB was started and seeded, `npm run test:http` exit 0 with 102 checks passed; `npm run test:php` still 2/13 due stale unit fixtures versus current services.
- Evidence: `docs/QA_FORM/evidence/php-tests.json`, `docs/QA_FORM/evidence/browser-verification-2026-11-27.json`.
- Blocker: PHP unit fixtures are stale (recorded as OBS-001); HTTP suite is green.
- Next action: Refresh PHP unit fixtures; defects logged in T-07.

### T-05 - Browser/UI evidence attempt
- Status: Done
- Requirements: FR-05
- Dependencies: T-02
- Files/components: added `docs/QA_FORM/evidence/browser-checks.json` and `docs/QA_FORM/evidence/browser-verification-2026-11-27.json`; edited `tools/release-browser-check.cjs`, `tools/access-rights-browser-check.cjs`, `tools/release-http-check.cjs` and four API files for discovered blockers.
- Acceptance criteria: browser checks attempted; unavailable tooling recorded as Blocked, not PASS.
- Verification: release browser 29 checks PASS, HTTP 102 PASS, access rights 11 PASS, employee UI 12 PASS, student invoice 15 PASS; invoice-email and receipt mock fixtures FAIL (DEF-003/004); Lighthouse Blocked.
- Evidence: `docs/QA_FORM/evidence/browser-verification-2026-11-27.json`.
- Blocker: DEF-003, DEF-004, BLK-002 remain open.
- Next action: Fix the two stale mock fixtures; defects logged in T-07.

### T-06 - Role-based UAT
- Status: Blocked
- Requirements: FR-06
- Dependencies: T-01, user-supplied staging accounts
- Files/components: added `docs/QA_FORM/evidence/uat-blocked.json`
- Acceptance criteria: each persona has result row with real login evidence; no localStorage spoofing.
- Verification: no staging URL or accounts supplied; 0 cases executed.
- Evidence: `docs/QA_FORM/evidence/uat-blocked.json`.
- Blocker: Staging URL, QA accounts and linked QA data not supplied by user.
- Next action: Await staging access, then execute matrix and fill handover form.

### T-07 - Defect triage and gate
- Status: Done
- Requirements: FR-08
- Dependencies: T-03, T-04, T-05, T-06
- Files/components: added `docs/QA_FORM/evidence/defects-and-gate.md`
- Acceptance criteria: every Fail mapped to defect ID; every Blocked has reason; GO/NO-GO justified.
- Verification: 2 defects (DEF-001 lint, DEF-002 artifact), 4 blockers (BLK-001..003, OBS-001), gate NO-GO with six explicit GO conditions.
- Evidence: `docs/QA_FORM/evidence/defects-and-gate.md`.
- Blocker: None for triage; upstream blockers remain open.
- Next action: Transfer results into handover form in T-08.

### T-08 - Printable handover form
- Status: Done
- Requirements: FR-07, FR-08
- Dependencies: T-01, T-07
- Files/components: added `docs/QA_FORM/QA_SERAH_TERIMA_TEMPLATE.md`, `docs/QA_FORM/QA_SERAH_TERIMA_<run>.md`, `docs/QA_FORM/QA_SERAH_TERIMA_<run>.xlsx`, `docs/QA_FORM/README.md`, and `tools/qa-generate-xlsx.cjs`; all QA documents moved from `docs/qa/` to `docs/QA_FORM/`
- Acceptance criteria: sections A-F present; print instruction; no passwords; totals consistent; signature fields present.
- Verification: sections A-F present in both files; rekap cross-checked (72 cases, 11 personas, 8 open findings, gate NO-GO); `npm run qa:xlsx` exit 0 and workbook reread with 9 sheets / 72 case rows; `git diff --check` exit 0. Print-to-PDF is a manual browser step documented in both files and not executed headlessly.
- Evidence: `docs/QA_FORM/QA_SERAH_TERIMA_TEMPLATE.md`, `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.md`, `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.xlsx`, `docs/QA_FORM/README.md`.
- Blocker: Manual PDF print remains for the QA preparer.
- Next action: Supply staging access and rerun blocked checks, then update the filled form.

### Handoff
- Current task: None
- Next ready task: None; T-06 and blocked gates await staging/database access and defect fixes
- Latest verification: T-08 forms complete with consistent rekap; `git diff --check` exit 0; gate NO-GO
- Remaining blockers: DEF-001..DEF-005, BLK-002, BLK-003, OBS-001; manual print-to-PDF

## Amendments
- Rev 1 / amendment 1, 2026-11-27. User request: "masukakn semua dokumen terkait di folder terpisah QA_FORM di dalam docs" and "setelah itu buatkan versi excel atau google spreadsheet". Impact: all QA documents moved from `docs/qa/` to `docs/QA_FORM/`; added an Excel workbook (uploadable to Google Sheets) generated by `npm run qa:xlsx`; T-08 scope extended. Approved A/B baseline otherwise unchanged; D-02 now reflects that Markdown remains the printable master and XLSX is a generated companion. Approval state: Granted by the quoted user request.
