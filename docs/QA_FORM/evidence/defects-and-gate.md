# Defect and gate log - QA run 2026-11-27

Build/commit under test: `cbb4c90` (merge of main `2599827`). Environment: local Windows, MariaDB 10.4.32, PHP 8.2.12, Node v26.1.0, real Chrome/CDP. Staging handover environment was not supplied.

| ID | Severity | Modul | Temuan | Status | Owner | Target | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEF-001 | Major | Frontend / LMS & Quiz | `npm run lint` exit 1: final rerun 639 problems (572 errors, 67 warnings), concentrated in merged LMS/Quiz files. Earlier run showed 350 problems (317 errors, 33 warnings) before the local Lighthouse install; the difference is recorded as an environment caveat. | Open | Frontend owner | Before handover | Not run |
| DEF-002 | Blocker | Release artifact | `config/db_env.php` with DB credentials is written into `dist` by `copy-backend.js:57-62`; artifact gate rejects the package. Values intentionally not recorded. | Open | Release owner | Before handover | Not run |
| DEF-003 | Major | Finance browser fixture | `tools/invoice-email-browser-test.mjs:93` expects `student@example.test` in the rendered page; current fixture UI no longer shows that recipient. Runner exits 1. | Open | Finance/QA owner | Before handover | Not run |
| DEF-004 | Major | Finance browser fixture | `tools/receipt-browser-test.mjs:95` cannot find the `Verify` button after switching to Daftar Pembayaran; runner exits 1. | Open | Finance/QA owner | Before handover | Not run |
| DEF-005 | Major | Student LMS UI | `/lms/tugas` (`src/pages/lms/LmsTugas.jsx`) renders localStorage demo tasks (Gojuon fixtures) from `src/services/lmsStudentData.js` instead of the server `lms_tasks.php` payload. Browser verification had to use the API as authoritative source. | Open | LMS owner | Before handover | Not run |
| DEF-006 | Major | Performance / Accessibility | Lighthouse executed locally: mobile 78/96/100/100, desktop 98/96/100/100 (performance/accessibility/best-practices/SEO). Issues: LCP 6.1s mobile, color contrast, label/accessible-name mismatch, image delivery ~834 KiB savings, unused/minified CSS. Runner exits 1 by design because scores are below 100. | Open | Frontend owner | Before handover | Not run |
| FIX-001 | Major | LMS API | `backend/api/relationships.php` count queries used `rs_class_filter` alias `c` without aliasing `lms_classes`, causing SQL 1054. Alias added. | Fixed in this QA run | QA | - | HTTP + browser PASS |
| FIX-002 | Blocker | Billing API | `add_invoice` accepted client-supplied `status: 'Lunas'`, allowing fabricated paid invoices. Guard restored: new invoices must be `Unpaid`. | Fixed in this QA run | QA | - | HTTP 102 PASS |
| FIX-003 | Major | Billing API | Student billing SELECT reused `$selName` containing `AS nama` inside a subquery WHERE, producing SQL syntax error. Replaced with bare `$nameExpr`. | Fixed in this QA run | QA | - | Browser PASS |
| FIX-004 | Major | QA runner | `release-browser-check.cjs` had stale UI labels/buttons and a batch fixture without 2026, causing false failures. Updated to current labels, added `PHP_BIN`/`CHROME_BIN` overrides and API-based verification. | Fixed in this QA run | QA | - | Browser PASS |
| BLK-001 | Blocker (environment) | Backend/HTTP/browser QA | Local database was absent at first run. Resolved by starting XAMPP MariaDB and creating `one-creativa` from the master schema. | Resolved | QA environment | - | HTTP + browser PASS |
| BLK-002 | Blocker (environment) | Performance QA | Lighthouse was not installed initially. Resolved by `npm install --no-save lighthouse chrome-launcher` and setting `CREATIVA_LIGHTHOUSE_PATH`; the check now runs and reports real scores (DEF-006). | Resolved | QA environment | - | Lighthouse ran; scores recorded |
| BLK-003 | Blocker (input) | Role-based UAT | No staging URL, QA accounts, or linked QA data supplied; all 72 matrix cases remain Not Run. | Open | System owner | Before handover | Not run |
| OBS-001 | Observation | QA evidence freshness | Prior audit evidence is dated 2026-10-12 and predates November quiz/finance changes. | Open | QA lead | Before handover | Not run |

## Gate decision

**NO-GO.** Browser/UI acceptance on the local synthetic environment is green across six runners (169 passing checks plus a verified 5-page PDF), but handover cannot be accepted while staging UAT is absent, two Finance browser fixtures fail, the student LMS UI ignores server data, lint/artifact gates fail, and Lighthouse reports performance/accessibility findings.

Conditions to change the gate to GO:

1. DEF-001 and DEF-002 closed or explicitly accepted in writing by the system owner.
2. DEF-003, DEF-004, DEF-005 and DEF-006 fixed and their runners rerun green.
3. BLK-003 resolved: staging access and QA accounts supplied; the 72-case matrix executed and signed.
4. Every matrix case has a final status; every Fail has a defect ID; every Blocked has a reason.
