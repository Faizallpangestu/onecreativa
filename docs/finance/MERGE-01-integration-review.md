# MERGE-01 - Integration review

**Outcome: BLOCKED BY EXTERNAL CONTRACT (deployment).** Technical conflict resolution is complete locally. The merge remains uncommitted on `integration/finance-merge-01`; main is untouched. D1-D7 below implement the user's final decisions, superseding the earlier business-decision stop report. No production access, migrations, messages, commit, push, PR or deployment occurred.

## Git references and resolution

| Reference | SHA |
| --- | --- |
| Integration HEAD / origin/main | `457c3f22bfb53c799710ee06759f8f7c88b8b6fc` |
| MERGE_HEAD / origin/feat/backend-finance-workflow | `208c4a66885a6ced5e04bb71b381907c168e7322` |
| Merge base | `b38ae66cbbf2ea8cd802cbf9979b4db6d842ffa5` |

The existing merge was continued, never restarted/aborted/reset/stashed. No new fetch was needed for this continuation. Main has three unique commits (`28c4eff`, `fc40582`, `457c3f2`); feature has eight (`860ba37`, `8211f49`, `685c09d`, `c73a40a`, `7d8aed6`, `da362d4`, `6f0790d`, `208c4a6`). Local main remains at its earlier HEAD; integration was originally created from origin/main.

Resolved: `backend/api/billing.php`, `backend/api/sync_students_web.php`, `backend/api/webhook_registration.php`, `src/components/BuatInvoiceWizardModal.jsx`, `src/pages/InvoicePenagihan.jsx`. Semantic integration also changes `rpa_automation.php`, `registration_sync.php`, `student_pricing.php`, `enrollment_billing.php`, `billing_invoice.php`, `payment_schemes.json` and `studentInvoice.js`. Added focused PHP/JS checks. The 55 previously auto-staged paths remain part of the merge.

Preserved earlier partial resolutions: imports, validated account/preview selection, invoice deletion guards plus legacy tombstones, checked delete responses, payment/submission tab wiring and polling of actual server invoice/payment/delivery/submission records. Main's dashboard projections remain projections; they do not post accounting transactions. M3.2/M3.2.1 receipt, billing/accounting status separation and mail transport implementations remain intact.

## Final policies implemented

| Decision | Integrated behavior | Remaining activation dependency |
| --- | --- | --- |
| D1 approval | Sync and webhook share `registration_process()` and `registration_auto_issue()`. Only explicit registration review approved plus screening passed can proceed to Finance-approved pricing/charge/bank validation. | Upstream must forward authoritative approval evidence and stable identities. |
| D2 pricing | Separate conceptual full/cicilan from installment_count. New explicit options are 1/3/6. Multiple approved counts per program can coexist; ambiguous generic cicilan requires selection. | Finance must approve exact program/count-specific amounts, terms, due offsets, charge authorization and bank. |
| D3 identity | Participant ID is retained as a source registration reference, never automatically person/enrollment identity. Explicit person ID or valid unambiguous NIK; explicit external enrollment ID. | Upstream identity contract/reconciliation; participant ID alone is insufficient. |
| D4 duplication | Retain legacy processed/deleted tombstones and BE-03 unique charge ownership plus official atomic sequence. | Prove legacy enrollment associations; report historical duplicate numbers. |
| D5 sender | PHP M3.1/M3.2 is the sole email authority. Legacy SMTP helper is inert, no mail() fallback. WA remains independent. | Mail/n8n cutover and authorized Finance sender configuration. |
| D6 dashboard | Preserve adapter entry points but return needs_review with writes_enabled=false. Verification returns separate dashboard_sync state. | Proven remote mapping and idempotent write/acknowledgment contract. |
| D7 payment | Preserve payment_id verification, request idempotency, exact balances, immutable receipt and server PDF selection; email failure is independent of payment persistence. | Existing M3.2 operational setup, not a new payment policy. |

### Approval and registration retention

`details` may be an object or valid JSON-encoded object. Only `details.review_status=approved`, boolean `details.screening.eligible=true` and an explicit passing overallStatus (`passed`, `pass`, `eligible`) pass. Unknown/conflicting/missing values fail closed; the upstream enum must be confirmed before activation. Pending/rejected/payment review, false/ambiguous screening and general Pending/Pembayaran/Aktif/Alumni statuses cannot authorize issuance. Client-supplied manual_override does not authorize a screening override; no authoritative override contract has been supplied.

A pending enrollment keeps no approved pricing snapshot/charges. Reprocessing the same proven enrollment after approval can freeze its rule and create its authorized charge once. Later replay uses the existing charge/invoice and never automatically resends. A later failed approval/assertion sets review_reason while preserving the old snapshot and issued invoice/payment amounts. Legacy approved snapshots missing registration evidence require reconciliation for new upstream issuance; they are not silently amended. Historical reads/payments remain available.

Normalized records lacking person identity are retained in existing registration_review audit records, including source record reference and missing-contract reason; no random audit ID is used as enrollment identity. Missing enrollment identity is retained with needs_review and no invoice. Accounting identity conflicts remain explicit HTTP 409 and receive a reconciliation audit after rollback. No name/email/phone matching establishes ownership. Invalid NIK cannot overwrite saved NIK or authorize fallback identity.

### Pricing, schedule and snapshot compatibility

Catalog selection accepts `installment_count` separately and recognizes Cicilan/Angsuran 3 Termin and 6 Termin aliases; DP/Angsuran remain cicilan. An ambiguous cicilan request never becomes full payment. New explicit count must match the approved schedule. Decimal cents must sum exactly; due offsets must be valid and ordered. Conflicting counts/nominal assertions require review.

Rule and charge snapshots retain the selected count/schedule; issued invoice metadata freezes actual amounts/dates and installment_count. A different enrollment is never priced from the first enrollment's global total_biaya. Existing approved rules that omit installment_count retain their exact legacy schedule, including counts outside the newly proposed options; they are not converted into three/six terms. Historical snapshot hashes are not rewritten by catalog changes. A single-option legacy catalog lookup key remains compatible; multiple options use count-specific keys.

`backend/config/student_pricing.json` remains **version 1 with rules=[]**. No production approvals, prices, bank or charge policies were fabricated. Synthetic approvals exist only in tests. Missing exact policy/schedule returns needs_review; nothing is proportionally scaled or rounded to force issuance.

### DRAFT pricing migration/reference - NOT APPROVED

| Legacy/historical reference | Observed amount/terms | Required decision |
| --- | --- | --- |
| Intensif Offline | Rp15,000,000 | Finance policy/version, enrollment applicability and bank/charge approval. |
| Kaigo / Dana Talang | Rp17,760,000 | Same; do not apply Intensif policy automatically. |
| Sotsugyousei | Rp7,500,000 | Same. |
| Reguler | Rp5,000,000 | Same. |
| Intensif six terms at Rp15m | 5m / 3m / 2.5m / 1.5m / 1.5m / 1.5m | Exact approved due dates/offsets and applicability; no scaling to other totals. |
| Legacy three-term webhook | 40% / 30% / 30% for some amounts | Program, exact decimal amounts and dates need approval; percentages alone are insufficient. |
| Historical upstream Full Payment | Rp12,000,000 | Reconcile policy/cohort; neither replace all prices nor rewrite old invoices. |

These are code/sample observations, not proof of official policy. Finance must supply genuine approval reference, approver/date, exact rule and independently approved charge/bank before activating a catalog entry.

## Upstream findings (anonymized summary only)

User supplied findings from 23 participant records and 31 invoice rows. participants.id identifies a source record, not a proven permanent person. Duplicate-person records and a rejected duplicate exist. external_student_id/external_enrollment_id were absent; submission_id was null. details is often encoded JSON; review/screening and payment data may be incomplete/conflicting.

Several remote invoice rows may belong to one participant and may represent installments. Historical base invoice numbers can repeat, and some referenced participants were absent from the participant sample. Never infer one enrollment from all rows for a participant or use invoice number alone as a historical remote unique key.

**Separate security blocker:** the upstream participant list exposes sensitive identity/authentication/screening fields that must not be available through unrestricted list endpoints. Upstream/security PIC must restrict/redact that API before broad integration rollout. MERGE-01 does not rewrite that upstream API. No raw responses, real identities, credentials, health details or document/token URLs have been added to Git.

## Tombstones, numbering and migration prerequisites

- Existing rpa_processed_registrations is preserved. If a source record has a legacy processed/deleted marker without provable charge ownership, new issuance is blocked for reconciliation. A charge link proving a different enrollment can allow the distinct approved enrollment; web_id is not a person-wide ban.
- Consumed charges return their existing invoice; a missing/deleted/invalid ownership link fails closed, never allocates a replacement. Official charge invoices and verified-payment invoices remain protected from deletion.
- All new official issuance uses billing_issue_charge()/eb_number(), with transactional sequence row locking, collision skipping against saved invoice IDs and the existing unique constraint. Existing numbers are not rewritten; 9999 overflow requires review. SQL concurrency behavior was not rerun in this continuation.
- No new tables or migration were added for integration/count selection. Review and back up before applying existing BE-03 migration `20261113_finance_enrollments.php`; check InnoDB, schema version/checksum, existing invoice unique index, duplicate IDs, ownership conflicts and intact tombstone history on a development copy first. Remote duplicate invoice numbers require separate reconciliation and must not be imported as unique local IDs blindly.
- Reconcile old records only using authoritative source/person/enrollment/charge evidence with Finance/DB PIC approval and audit. Never backfill from names/contact/NIS/approximate programs. Preserve billing/payment/delivery/accounting/audit rows. Recovery is a reviewed code rollback and data restoration plan; do not drop populated BE-03 tables or rewrite issued snapshots to undo the integration.

## Notifications and remote dashboard

Finance invoice/receipt email APIs, PDF attachments, shared private SMTP settings, CC, durable automation_logs stages, stable request IDs, explicit resend and Delivery Uncertain protection are retained. Both sender example/default settings remain empty. No private configuration was changed or inspected to establish production readiness. SMTP Accepted proves submission acceptance only, never inbox/read status.

The old combined resend_notification action is not an alternative email sender; callers must use send_invoice_email with the M3.1 request/history contract. Finance UI uses that component. Legacy rpa_send_smtp_email callers now return false instead of bypassing sender policy. Invoice/receipt RPA paths cannot invoke a second SMTP transport. Receipt n8n dispatch is WA-only; its email recipient/body are withheld, and direct local WA is not invoked in addition to the n8n route. Invoice webhook notification envelope similarly reserves email for PHP (email/email_subject/email_html are empty); the invoice's saved recipient is preserved in the DB.

New registration issuance prepares a Menunggu Bot delivery record, never preemptively Terkirim or Dibaca. Replays/pricing-review responses do not prepare another notification. PHP Finance send is available; unattended registration email dispatch is not claimed complete by preparation/history alone and requires an authorized operational dispatcher/cutover. Receipt email still follows M3.2 verification. Existing WA gateway helpers/manual chat controls remain separate. Chat text uses the saved official document URL, not hardcoded bank/price/two-day terms; opening chat is not delivery evidence.

The checked-in n8n exports retain disabled/disconnected email branches from M3.1/M3.2. The live workflows have not been updated. Before enabling PHP mail, operations must disable/drain their email branches and pending legacy jobs, confirm one authoritative sender and test controlled recipients. Update n8n normalization to forward authentic person/enrollment IDs, JSON details with screening/review, selected installment_count and decimal assertions without guessed program/full-payment defaults. Preserve backend invoice IDs, gate on actual new issuance/needs_delivery, and acknowledge actual WA delivery separately (BE-04).

Remote invoice/payment adapters now make **no remote requests**. Even apparently complete mappings cannot enable writes until upstream supports stable participant/person/enrollment/charge/invoice/payment associations, unique idempotency keys and saved verification acknowledgment. No forced cicilan, participant-wide installment insertion, near-amount Lunas matching or independent payment recognition remains in those adapters. Missing contract is visible as needs_review; this business capability is preserved as an inactive adapter, not claimed operationally integrated.

## Targeted checks actually executed in this continuation

| Command/check | Result |
| --- | --- |
| php backend/tests/merge01_checks.php | **45 PASS**: approval/transition, identity normalization, full/3/6 pricing, exact sums/dates, legacy schedule/snapshot compatibility, tombstone policy, inactive adapters/senders, plus 5 labeled source-contract checks. No DB/network. |
| node tools/merge01-checks.mjs (initial version) | **16 PASS**: official 1/3/6 payloads, count/owner rejection, scheme aliases, exact receipt selection with mock dialog/window, plus 2 labeled source checks. |
| node tools/merge01-checks.mjs --whatsapp-only | **3 PASS** after finding two remaining legacy hardcoded chat messages: missing official URL blocked, saved URL/token preserved, all three controls share the safe helper. No WhatsApp request. The final default script now contains all 19 JS checks; only the added 3 were rerun. |
| PHP -l on 8 changed runtime PHP files and new focused test | **9 PASS**, no syntax failures. |
| ESLint wizard and studentInvoice utility | **0 errors / 0 warnings** each. |
| ESLint InvoicePenagihan | **23 existing errors / 0 warnings; 0 introduced**, compared with feature baseline (23) and main (27). Only this page was rechecked after the chat-message correction: still 23 existing, 0 introduced. This is not an overall lint pass. |
| Feature preservation / conflict markers | **6 unchanged core-file comparisons**, **5 marker checks clean**. Source verification only. |
| git diff --check and git diff --cached --check | **PASS**; repeated only after final index resolution/documentation to verify the actual reviewable merge. |

Total new focused assertions actually run: **64 PASS**, including 8 source-contract assertions. Pure/mocked and source checks do not prove SQL concurrency, real SMTP/PDF, browser behavior or live upstream integration. Prior 197+45+53=295 checks are reported baseline history only, not newly run/passed.

Intentionally skipped: full BE-01-BE-03/M3.1/M3.2 suites, disposable MariaDB and migration execution, real SQL retry/concurrency/reconciliation smoke, SMTP TLS/Gmail/WhatsApp/n8n/upstream requests, full browser/PDF tests, full frontend build and ZIP packaging. No skipped test is marked passed. A pre-existing accounting fixture failure was not investigated/rerun in this focused integration.

## Readiness and next action

Technical diff is ready for local review; deployment remains **BLOCKED BY EXTERNAL CONTRACT**: (1) genuine Finance catalog/charge/bank approval, (2) proven person/enrollment and legacy mappings, (3) upstream list-data exposure fix, (4) single-sender live n8n/SMTP cutover and authorized unattended dispatcher, (5) remote dashboard idempotency/mapping contract, (6) reviewed BE-03 development migration/preflight and release validation. account_holder validation was not weakened.

Review the staged integration and these dependencies. Before a PR/release, obtain PIC contracts/approvals, validate the migration on an approved isolated copy, and run only the critical DB/operational acceptance checks justified by those newly supplied dependencies. A merge commit/push/PR requires a subsequent user instruction. None is performed here.
