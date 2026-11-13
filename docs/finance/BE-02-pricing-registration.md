# BE-02 — Unified pricing and registration sync

## Deployment gate

**NOT READY TO DEPLOY until Finance approves the catalogue and rollout.** No
Finance-approved price list, discount policy, or installment calendar was found
in the inspected repository. A comment saying “resmi”, an old UI preset, or a
positive `peserta_intensif.total_biaya` is not evidence of approval.
`backend/config/student_pricing.json` deliberately contains **zero rules**.
Do not copy the synthetic approvals in `backend/tests/pricing_fixture.php` into
application configuration.

The safe behavior with this empty catalogue is intentional: save registration
identity for review, issue no new invoice, and return a pricing conflict on new
Finance invoice creation. Existing invoices/payments remain readable and are
never repriced by registration or sync. Deploying this unchanged catalogue would
stop automatic invoicing and new Finance invoices. Finance must approve that
behavior or supply approved rules before deployment. This gate is independent
of the separate BE-01.1 bank-master/account-holder requirement.

## Inventory: code behavior versus approved policy

Amounts below are rupiah from code, **not approved policy**. Webhook/sync refer
to their pre-BE-02 branch baseline; old FE presets are visible in commit
`8835732`, `src/components/BuatInvoiceWizardModal.jsx` (`resolveProgramPreset`).
The BE-01.2 wizard already removed those price defaults.

| Program / canonical key | Legacy webhook full / cicilan | Old FE full / cicilan | Approved policy evidence |
| --- | --- | --- | --- |
| Intensif Offline / `intensif_offline` | 15,000,000 / 18,000,000 | 15,000,000 / 18,000,000 | None found |
| Kaigo Dana Talang / `kaigo_dana_talang` | 17,760,000 / 17,760,000 | 17,760,000 / 17,760,000 | None found |
| Matching Job / `matching_job` | Falls through to 15,000,000 / 18,000,000 | 25,000,000 / 25,000,000 | None found; discrepancy requires decision |
| Sotsugyousei / `sotsugyousei` | 7,500,000 / 7,500,000 | 7,500,000 / 7,500,000 | None found |
| Kursus Reguler / `kursus_reguler` | 5,000,000 / 5,000,000 | 5,000,000 / 5,000,000 | None found |

Cross-cutting differences:

- Webhook allowed numeric `nominal`, then positive `total_biaya`, to override
  hardcoded amounts using floats. Unknown programs inherited Intensif prices.
  Unknown schemes became full payment unless their text contained `cicil`/`dp`.
- Sync cast upstream `total_biaya` to float, missing to zero, and overwrote the
  stored amount. It had no catalogue validation. Old FE also preferred a positive
  custom/stored amount over its presets. Current FE uses the database amount.
- `peserta_intensif.total_biaya` is an operational DECIMAL field, not a price
  catalogue. No production rows were read during this work. Actual stored fees
  and exceptions still require a Finance-owned reconciliation; the matrix does
  not assert that real students pay the code presets.
- Legacy 18,000,000 cicilan: six terms 5M + 4M + 3M + 2M + 2M + 2M. Webhook used
  first due in two days, later terms monthly. Other amounts used rounded
  40%/30%/remainder. Old FE also used alternative 40% + remaining halves. Current
  FE requires explicit terms and exact sums instead of manufacturing a schedule.
- Webhook full-payment due was two days. No verified policy source supports this
  deadline or any of the installment splits. BE-02 removes these price/schedule
  defaults from issuance; it does not declare them approved.
- Old FE exposed editable price/discount controls; webhook/sync had no approved
  discount/exception master. BE-01 already rejects nonzero invoice discounts.
- Webhook descriptions still mention seven months/common inclusions; old FE
  durations varied (Intensif seven, Kaigo six, others four). These descriptive
  terms, existing bank templates, and delivery behavior are preserved within
  scope and must be reviewed before activating rules for those programs.

## Shared service and approval contract

`backend/services/student_pricing.php` provides program-name normalization,
scheme normalization, catalogue validation, exact monetary comparison, approved
schedule generation, and invoice assertions. Program aliases are **legacy name
mappings only**; they contain no prices or approval. Payment aliases live in
`backend/config/payment_schemes.json`, consumed directly by PHP and
`src/utils/studentInvoice.js`:

- Full/full payment/pembayaran penuh/lunas/tunai/cash normalize to `full`.
- Cicilan/angsuran/DP/down payment/installment aliases normalize to `cicilan`.
- Matching is exact after case/whitespace normalization. Unrecognized compound
  labels need review; they never default to full. Mapping “DP” identifies a
  scheme, not the DP amount, number of terms, or a partial total.

Catalogue format is version 1, a `rules` list. An active approved rule requires:

| Field | Validation / policy responsibility |
| --- | --- |
| `id`, `program`, `scheme` | Nonempty ID, known canonical program, full/cicilan. One active rule per program/scheme; conflicting rules fail closed. |
| `active`, `approval.status` | Only literal `true` plus `approved` enables a rule. Draft/inactive rules cannot price invoices. |
| `approval.reference`, `approved_by`, `approved_on` | Required approval reference, approver, valid YYYY-MM-DD date. Finance must supply real evidence; code validates structure, not authenticity of an external approval document. |
| `amount`, `discount` | Positive exact decimal amount; discount must be zero to retain BE-01. No floats, rounding, separators, exponent notation or excess precision. |
| `installments` | Full: exactly one term. Cicilan: 2–120 positive terms, exact sum equals rule amount. |
| Term `label`, `amount`, `due_days` | Required label, exact decimal, integer 0–3660 days after invoice date, nondecreasing dates. No implicit monthly or percentage policy. |

Amounts use existing `ac_cents`, `ac_decimal`, `ac_add`; API/SQL boundaries use
decimal strings. Maximum amount is DECIMAL(15,2). Missing upstream claims may be
priced from an approved rule; every supplied nonempty `nominal`/`total_biaya`
assertion must equal it. Zero/negative/malformed amounts, contradictory aliases,
nonzero/invalid discounts, or supplied schedules inconsistent with the rule
produce `needs_review`. New registrations then have `total_biaya=NULL`.

Configuration is server-owned, never selected from a request. Audit and newly
created invoice metadata retain rule ID, normalized rule hash, and approval
reference. Review decisions retain reason and claimed amounts in
`accounting_audit_logs`; no new table/column/migration is introduced. Existing
endpoint schema self-healing behavior is retained, not expanded.

## Identity, preservation, and retries

Both endpoints call `registration_process` in
`backend/services/registration_sync.php`:

1. Identify by fixed upstream source + positive `web_id`/upstream `id`; use an
   explicit NIK when a source ID is absent. These remain distinct from the
   database-generated `peserta_intensif.id`. Missing stable identity is audited
   for review without inventing a student or NIS. Names never establish identity.
2. Ambiguous IDs, conflicting NIK/source IDs, different sources, and legacy
   contact collisions require review/409. Email is only a collision warning;
   it is never used to merge students. Existing legacy records without stable
   identity need a controlled reconciliation, not automatic reassignment.
3. Serialize the same source registration with a MySQL named lock shared by
   webhook and sync. Within a transaction, lock participant/invoice rows, write
   registration, optionally issue an approved invoice, and audit. A lock conflict
   returns 409; audit/SQL failure rolls back all transactional writes.
4. Protect **all** positive existing fees and their program/scheme, including
   legacy fees whose provenance is unproven. Invalid/empty upstream values never
   clear them. A different approved price/program/scheme is
   `stored_pricing_conflict`, not an automatic correction. No bulk revalidation
   or historic fee rewrite runs. Known rules can initialize new/null/zero fees.
5. Sync never writes invoices or payments. Webhook only reuses an exact
   registration key or exact legacy webhook source-ID. A conflicting stored
   `student_id`, multiple invoice candidates, student-only invoice association,
   or legacy email collision stops new issuance for review. Repeated webhook
   calls reuse the same recognized registration invoice.
6. Existing recognized invoices, including those with verified payments, are
   read only: amount, status, metadata, dates and public token remain unchanged.
   A pricing-review response can still reference an existing historical invoice;
   this does not approve its historical price. No payment record is synthesized.

The named lock addresses same-registration replays. Cross-registration numbering
still uses the existing monthly MAX+1 sequence; a primary-key collision returns
409 and rolls back rather than creating partial data. This is **not** a claim of
complete business-level deduplication. Re-registration lifecycle, cross-manual
invoice ownership, and safe global number allocation require BE-03 decisions.

## API changes and compatibility

- Existing success/error envelopes and webhook secret/session authentication
  remain. A registration accepted for review returns 200 `status: success`,
  representing identity processing, **not invoice issuance**.
- Webhook `summary.pricing_needs_review` counts review results. Each result adds
  `pricing_status` and `pricing_reason`. Without a usable existing invoice and
  approved pricing, `invoice_id=null`, `invoice_created_now=false`,
  `needs_delivery=false`, monetary fields are null and installments empty.
  Consumers must check these fields before using invoice URLs/messages.
- New webhook invoice amounts and term amounts are decimal **strings**. Reused
  invoice totals are strings; historical schedule metadata keeps its original
  representation. Unparseable/float historical term amounts yield null
  `due_now_nominal` and `legacy_installment_requires_review`, without rounding or
  rewriting that history. Clients
  that require JSON numbers need an explicit compatibility update; converting to
  float is not part of this implementation.
- Sync retains `students`, counts and success envelope; adds
  `pricing_needs_review` and `pricing_reviews` (student ID, status, reason).
  Reviews describe the incoming sync attempt; a previously preserved stored fee
  may still match an approved rule.
- Accounting lookup students add `pricing_status`/`pricing_reason`, computed
  against current catalogue and stored program/scheme/fee. These describe current
  rule eligibility, not proof that a historical upstream claim was approved.
- BE-01 `add_invoice` retains all permissions, student ID, amount/status/discount
  checks, bank master validation, transactions, duplicate handling and audit.
  It additionally requires approved pricing (409 if unresolved) and exact
  approved scheme/term amounts/dates (422 if inconsistent). Omitted installments
  are generated only from the approved rule; explicit null/empty is invalid.
  Invoice due date must equal the first approved term date. Finance/FE must use
  the approved schedule, rather than arbitrary dates/splits. Schedule display
  from approved rules needs a follow-up integration before rollout if the
  existing UI cannot represent the policy. No new schedule endpoint is invented.
- No manual-invoice feature, `student_invoice_links`, receipt, payment, bank
  holder checks, n8n, or delivery integration is changed. Registration webhook's
  existing bank templates remain independent of the Finance master as before.
- Known **BE-04** issue remains: legacy webhook delivery logging may say
  `Terkirim` without actual delivery confirmation (or `Menunggu Bot` when
  deferred). BE-02 does not fix or certify delivery. It performs no send itself.

Review reason identifiers include `unknown_program`, `unknown_scheme`,
`invalid_amount`, `amount_mismatch`, `pricing_not_approved`,
`invalid_pricing_configuration`, `discount_not_approved`,
`invalid_installments`, `conflicting_program`, `conflicting_scheme`,
`stored_pricing_conflict`, `missing_stable_identity`,
`multiple_existing_invoices`, `existing_student_invoice_requires_review`,
`invoice_owner_conflict`, `legacy_installment_requires_review`, and
`legacy_invoice_ownership_unknown`.

## Finance decisions required before rollout

- Confirm all program aliases, full/cicilan prices, Matching Job discrepancy,
  gross/net meaning of upstream `nominal`, taxes/discounts/exceptions, and scope
  of fees. Nonzero discounts remain unsupported until separately authorized;
  do not encode a discount as an unreviewed price override.
- Approve term count/amount/date rules, the invoice-date anchor, and whether
  calendar-month schedules or multiple price versions/cohorts are required.
  Version 1 deliberately rejects ambiguous concurrent prices for one program
  and scheme; it has no guessed effective-date/cohort rules.
- Supply approval evidence and review historic positive fees, conflicting
  student identities and invoices. Decide how staff process the audited review
  queue; this task does not add an approval screen or migration/backfill.
- Review descriptive durations/inclusions, confirm upstream review/null-invoice
  handling, and align the Finance UI with the approved schedule before deploying.

## Verification

`backend/tests/billing_invoice_test.php` creates/drops a random test database,
uses synthetic approval JSON in the OS temporary directory, and starts a private
local HTTP router. Registration sync uses an explicit test-only local fixture;
no upstream fetch or actual notification occurs. Tests cover shared aliases,
unknown programs/schemes, malformed/zero/negative/float amounts, maximum decimal
precision, full/cicilan sums and dates, tampering, repeat sync/webhook, preserved
positive pricing, legacy ownership conflicts, unchanged paid invoices/payments,
configuration failures, and audit rollback. Original BE-01/01.1 security cases
remain part of this suite, with synthetic approved pricing as an extra prerequisite.

Run locally with development DB configuration:

```text
C:\xampp\php\php.exe backend/tests/billing_invoice_test.php
node tools/student-invoice-test.mjs
node tools/student-invoice-browser-test.mjs
npx.cmd eslint src/utils/studentInvoice.js
npm.cmd run build
```

These are isolated integration/mock-UI checks, not production E2E or validation
of actual Finance policy. The independent legacy `accounting_test.php` currently
fails on its missing COA `1100` fixture (`accounting_test.php:41`); schema seeds
1110/1120/1130. This mismatch predates BE-02 and is not repaired here.

Verification on 2026-11-13 used a fresh, isolated local MariaDB datadir and random
disposable test databases, not production:

| Check executed | Result |
| --- | --- |
| PHP syntax, all 10 changed/new PHP files | PASS |
| Billing integration suite | PASS: 203 assertions (103 BE-01/01.1 + 100 BE-02) |
| Student invoice utility regression | PASS: 19 mock-API scenarios |
| Headless browser regression | PASS: 11 mock-API scenarios |
| ESLint `src/utils/studentInvoice.js` | PASS |
| `npm.cmd run build` | PASS; existing toolchain reports stale Browserslist data and plugin timing warnings |
| `git diff --check` | PASS |
| Independent accounting suite | FAIL: preexisting COA 1100 fixture mismatch above |
| Actual Finance pricing / production E2E | Not run; no approved rules or production access |

The generated deployment ZIP was restored to its committed contents; it is not
a release deliverable. The temporary MariaDB instance/test files were removed.

## BE-03 follow-up

Approve a registration/enrollment identity lifecycle (including repeat enrollment),
invoice uniqueness across manual/webhook sources, reconciliation of ownerless
legacy invoices, and a concurrency-safe global invoice number allocator. Preserve
existing invoice/payment history; do not treat contacts or program-name substrings
as business keys. BE-04 separately owns delivery truth and bot acknowledgements.
