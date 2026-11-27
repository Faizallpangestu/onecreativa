# Review - QA full-scope and handover form (2026-11-27)

Approved scope: revision 1 of `.agents/1-PRD-UTUH.md`, ACC quotation "kerjakan sesuai plan final kita", amendment for `docs/QA_FORM/` and XLSX. Build/commit under test: `cbb4c90`.

## Verification evidence

| Check | Command / procedure | Exit / result |
| --- | --- | --- |
| Test scripts registered | `npm run` | 0; test scripts plus `qa:xlsx` listed |
| Dependencies | `npm ci --no-audit --no-fund` | 0; node_modules ignored by git |
| Lint | `npm run lint` | 1; final rerun 639 problems (572 errors, 67 warnings) - DEF-001. Earlier 350 problems before local Lighthouse install; dependency drift noted in `build-gates.json`. |
| Build | `npm run build` | 0; vite build + login prerender + backend copy, 7.95 s |
| Artifact check | `node tools/check-build-artifact.cjs` | 1; `config/db_env.php` packaged - DEF-002 |
| Lighthouse | `node tools/lighthouse-build-check.cjs` | 1; installed locally and executed. Mobile 78/96/100/100, desktop 98/96/100/100 - DEF-006 |
| Backend suite | `npm run test:php` | 1; 2/13 passed; stale synthetic fixtures versus current services |
| HTTP checks | `node tools/release-browser-check.cjs --http-only` | 0; 102 checks PASS |
| Release browser desktop + mobile | `node tools/release-browser-check.cjs` | 0; 29 checks PASS; mobile screenshot written |
| Access rights browser | `node tools/access-rights-browser-check.cjs` | 0; 11 checks PASS |
| Employee UI state | `node tools/employee-ui-test.mjs` | 0; 12 checks PASS |
| Student invoice browser | `node tools/student-invoice-browser-test.mjs` | 0; 15 scenarios PASS |
| Invoice email browser | `node tools/invoice-email-browser-test.mjs` | 1; assertion at line 93 - DEF-003 |
| Receipt browser | `node tools/receipt-browser-test.mjs` | 1; button not found at line 95 - DEF-004 |
| UAT | manual review of available inputs | 0/72 cases; no staging URL or QA accounts - BLK-003 |
| Case matrix | ID count | 72 unique IDs; coverage map matches `QA_PHASE_5_16.md` |
| Form rekap | cross-check of B1/B2/B3/C/E against evidence | consistent: 8 Pass, 5 Fail, 1 Blocked gates; cases 26 Pass (lokal), 1 Fail, 45 Blocked, 0 Not Run; 11 personas; 8 findings |
| Secret scan | `Select-String` over `docs/QA_FORM` for credential/secret patterns | no matches |
| Excel generation | `npm run qa:xlsx` | 0; workbook written and reread with 9 sheets, 72 case rows, gate NO-GO |
| Path consolidation | `Move-Item docs/qa → docs/QA_FORM` + grep | folder moved; no stale references |
| Whitespace | `git diff --check` | 0 |
| Print to PDF | `npx marked@12` + Chrome headless `--print-to-pdf` | 0; valid 8-page A4 landscape PDF, `%PDF-` header; source form now includes all 72 cases with results and the full defect log |

Artifact hygiene: `npm run build` regenerated `One-creativa-dist-production.zip`; it was restored from the git index immediately afterwards and is unchanged in the working tree. Local MariaDB was started for the browser runs; no production database was touched.

## Outcome

Gate: **NO-GO**. Local browser/UI acceptance is green on six runners (169 passing checks plus a verified 8-page PDF) after environment and code fixes, but handover cannot be accepted while staging UAT is absent and the open defects remain. The filled handover form is now self-contained: it includes all 72 test cases, full defect/fix/blocker log, evidence index and sign-off. PDF and Excel versions are generated from it.

## Remaining issues

1. DEF-001 - ESLint errors in merged LMS/Quiz files; owner Frontend.
2. DEF-002 - database credentials written into release artifact; owner Release.
3. DEF-003 - invoice email mock fixture expects recipient text no longer rendered.
4. DEF-004 - receipt mock fixture cannot find Verify button.
5. DEF-005 - student `/lms/tugas` uses localStorage demo data instead of server task payload.
6. DEF-006 - Lighthouse reports performance/accessibility findings (mobile 78, desktop 98, accessibility 96).
7. BLK-003 - staging URL, QA accounts and linked data not supplied; all 72 UAT cases Not Run.
8. OBS-001 - prior QA evidence predates the November changes.
9. Google Sheets upload not executed (no account/credentials supplied); local PDF print is verified.

Every change made during this run (including the three product-source edits that were intentionally not reverted) is recorded in `docs/QA_FORM/RINGKASAN_PERUBAHAN.md`. No commit, push, deployment or production write was performed.
