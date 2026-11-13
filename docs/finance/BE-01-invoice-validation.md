# BE-01: server-side invoice validation

> BE-03 replaces new issuance with explicit enrollment/authorized-charge identity
> and backend invoice numbering. See [BE-03 contract and migration](BE-03-enrollment-charge-numbering.md).
> The original student-global-fee/client-invoice-ID contract below is historical.

> BE-02 adds approved-pricing eligibility and exact approved term schedules to
> this baseline contract. See [BE-02 pricing and registration](BE-02-pricing-registration.md)
> for the empty-catalogue deployment gate, webhook/sync changes, and API additions.
> Statements below describing the webhook as unchanged refer to the BE-01 baseline.

## Scope and existing flows

- `POST /api/billing.php`, action `add_invoice`, is called by
  `src/components/BuatInvoiceWizardModal.jsx` and the legacy invoice form in
  `src/pages/InvoicePenagihan.jsx`. At the BE-01 baseline both omitted `student_id`; the legacy
  form also permits arbitrary customer names, prices, discounts, and statuses.
  BE-01.2 now integrates the active wizard with the contract below and removes
  the unused duplicate form. The frontend behavior and verification are documented
  in the BE-01.2 section below.
- `src/pages/HistoryInvoice.jsx` calls a different endpoint: `/api/invoice.php`.
  Its `add_client` creates `invoice_clients`; its `add_invoice` uploads a receipt
  into `invoice_records`, with `needs_review`, rather than creating a
  `billing_invoices` row. Existing `prepare` authorization, request-key checks,
  and audit logging in `document_mutations.php` remain unchanged. This endpoint
  is not an alternative route to create student billing invoices.
- `backend/api/webhook_registration.php` creates automatic invoices separately
  with `Unpaid` status. Its upstream input, price presets, student matching,
  delivery, and existing invoices are unchanged. The webhook must not be used
  as a fallback for a rejected `add_invoice` request.
- `backend/api/accounting.php?view=lookups` exposes `students.id` and
  `students.total_biaya`. `billing.php`'s `siswa` list unions `peserta_intensif`
  and `billing_siswa`: IDs in that union are not interchangeable. FE must retain
  the identity from `peserta_intensif`; never infer it from name/email, NIS,
  website `web_id`, or a manually created `billing_siswa` record.
- `billing_invoices.id` is the primary key, `total` is `DECIMAL(15,2)`, and
  `meta_json` holds validated metadata including the student identity and amount
  provenance. No new column, table, or migration is introduced. An existing
  `meta_json` column is required; this creation path does not run schema DDL.

## Request contract for FE

Session cookie and `X-CSRF-Token` are required. The actor must have the existing
`prepare` permission (including configured role overrides). Monetary values use
`ac_cents`/`ac_decimal`: integers or decimal strings, at most 13 integral digits
and two fractional digits, no separators, exponent notation, negatives, floats,
or rounding. Send fractional currency values as strings.

Minimal JSON request:

```json
{
  "action": "add_invoice",
  "id": "TGCJ26110001",
  "student_id": 123,
  "bank_account_id": 7,
  "tanggal": "2026-11-13",
  "jatuhTempo": "2026-11-20",
  "total": "15000000.00",
  "status": "Unpaid",
  "keterangan": "Biaya program siswa"
}
```

- `student_id` is required and resolves only to `peserta_intensif.id`.
- `bank_account_id` is required and resolves only to an active official
  `cash_bank_accounts.id` backed by an active cash/bank COA. See BE-01.1 below
  for the required official holder data and configuration dependency.
- `total` is a required client assertion, compared exactly in integer cents to
  the locked student's stored `total_biaya`. The stored server amount must be
  available and positive. A mismatch returns 422. No price default is generated.
- Omit `status` or send exactly `Unpaid`. All other values, including `Paid`,
  `Partially Paid`, `Lunas`, `Sebagian`, and `Overdue`, return 422.
- `tanggal` and `jatuhTempo` are valid `YYYY-MM-DD` dates; due date must not be
  earlier than invoice date.
- `customer`, `email`, `phone`, `program`, and `lokasi` do not establish identity
  or pricing. Stored identity, contact details, program, and location come from
  the student record. Correct invalid official student data before retrying.
- `subtotal` may be omitted; when present it must equal `total_biaya`.
- `discount` may be omitted or zero. An object must include `amount: "0.00"`;
  `value`, if supplied, must also be zero. Nonzero discounts are rejected, even
  if a modified subtotal could produce the same total. The persisted discount
  is always zero; BE-01 does not authorize discounts or calculate upstream ones.
- `items` may be omitted. If supplied, it must contain exactly one fee item,
  `qty` absent or 1, with `harga` and `jumlah` (wizard shape) or `price` and
  `amount` (legacy shape). Every supplied amount alias must equal `total_biaya`;
  `diskon`/`discount`, if supplied, must be zero. Item labels and financial
  metadata are rebuilt from the server fee. Multiple independently priced items
  require the later pricing catalog; they are rejected in BE-01.
- `installments` may be omitted (one full-payment installment is generated).
  Otherwise provide 1–120 entries with positive `nominal` and valid
  `jatuhTempo`. Amounts must sum exactly to the official fee; dates must be
  ordered, the first must match the invoice due date, and none may precede the
  invoice date. Optional `deskripsi`/`keterangan` is validated text. Client IDs,
  payment balances/statuses, and extra nested fields are discarded. This checks
  arithmetic and dates, not commercial installment eligibility or pricing rules.
- `skema`, if supplied, must be `full` for one installment or `cicilan` for more.
- Other retained presentation metadata is bounded text (`durasi`, `salesCode`,
  `notes`) or bounded text lists
  (`includes`, `excludes`). These fields do not authorize a fee, discount, payment,
  or new commercial entitlement. Raw client `meta_json` is never stored.

Example optional installment plan for an official fee of `15000000.00`:

```json
{
  "skema": "cicilan",
  "installments": [
    { "deskripsi": "DP", "jatuhTempo": "2026-11-20", "nominal": "5000000.00" },
    { "deskripsi": "Pelunasan", "jatuhTempo": "2026-12-20", "nominal": "10000000.00" }
  ]
}
```

## Responses and compatibility

Success remains HTTP 200, `{"status":"success","data":{"id":"TGCJ26110001"}}`.
Errors retain `{"status":"error","message":"..."}` and the existing
`request_id` where provided by the global exception handler.

| HTTP | Meaning |
| --- | --- |
| 422 | Invalid payload, status, official fee, amount mismatch, discount, item, or installment |
| 401 | No active login session |
| 403 | Missing permission or invalid CSRF token |
| 404 | Student ID does not exist |
| 409 | Duplicate invoice number, lock timeout, unavailable official configuration, or ownership conflict |
| 500 | Unexpected database/audit failure; transaction is rolled back |

An identical invoice-number replay now returns 409 instead of the former
success response. Unique-key collisions are also translated to 409. Creation
and its actor/student/amount audit stay in one transaction. Existing invoice
rows, legacy discounts, payment-derived balances, and read responses are not
rewritten by the validation change.

The manual mode of **billing** `add_invoice` is intentionally unavailable:
omitting `student_id` or sending `invoice_type: "manual"` cannot bypass official
student validation. A separately authorized/audited manual billing mechanism is
not introduced in BE-01. The independent customer/receipt workflow described
above retains its existing authorization and audit behavior.

FE follow-up must also remove the two callers' existing success/localStorage
fallbacks on API errors. Show the backend error and create no local official
invoice when the server rejects the request. Keep invoice IDs stable for an
uncertain network result and reconcile with server data on 409 before issuing
another request; do not silently generate a new number and risk duplicate debt.

## Verification and BE-02 follow-up

### BE-01.2 frontend integration

The active invoice wizard now loads identities and bank records exclusively
from `accounting.php?view=lookups`. It retains `students[].id` separately as
`databaseId`, rather than treating NIS, `web_id`, a display ID, a name/email
match, or localStorage as an invoice identity. Syncing students reloads these
lookups after the sync response; upstream response IDs are never used for
invoice creation. Missing contacts remain empty rather than receiving dummy
email/phone values. The billing endpoint's mixed student list is display-only.

`banks[].id` is the selected `bank_account_id`. Available choices require an
active master record, active associated cash COA, and explicit official bank
name, account number, and verified holder. Display names are never substituted
for holder names. No local bank fallback is used. A missing official holder
blocks publication and explains the Finance/DB PIC dependency; backend 409
errors are also displayed with their original message and request ID.

Program, fee item, total, and additional discount are read-only. There is no
quantity input or program-price selector in the creation flow. The request
contains the official fee as a normalized decimal string, required database
IDs, stable invoice number, dates, `Unpaid`, zero additional discount, and a
validated schedule. No bank assertions or independent item prices are needed;
the backend creates canonical item and bank metadata. Decimal parsing and
installment summation use exact integer cents without float rounding.

The stored student payment method determines the displayed scheme. Missing or
unrecognized scheme data blocks publication for Finance review. In installment
mode, the current lookup has no approved installment schedule: Finance must
enter the confirmed dates and amounts explicitly. The wizard requires at least
two positive terms, exact sum, ordered dates, and first date equal to invoice
due date. It does not guess percentage splits, change prices, or silently switch
an invalid installment plan to full payment. Full payment uses one term for the
official amount and selected invoice due date.

An invoice becomes successful only after server `status=success` with the same
invoice ID. API failures leave the form and number intact. On 409, a lost
response, or server failure, the client checks billing data by exact invoice
number. Before an explicit retry it checks again. An existing number or an
unavailable check prevents another POST; a confirmed absence allows an explicit
retry with the same number. Finding that number is not sufficient proof that
the previous request owns it, so the UI does not convert a conflict into an
automatic success or generate a replacement number.

The wizard no longer writes `saved_custom_invoices`, `saved_custom_terkirim`,
or local student financial balances. Invoice preview also ignores those old
local caches. New invoices do not create delivery/payment history. The delivery
and payment tabs enrich only real `billing_terkirim` / `billing_pembayaran`
records, preserving their statuses and retaining no fabricated counterpart for
Paid/Partially Paid invoices. Missing payment history, reference, verified
holder, and student balances remain unavailable rather than being invented.
Payment approval reloads the server records and uses the server receipt URL.
The old simulated resend notification is replaced with an accurate explanation
that this flow does not send messages; no delivery API is added.

The **Tambah Siswa Baru** intake UI remains available, but cannot publish until
the student is registered through the existing business process and selected
from database lookups. It does not register students automatically. **Simpan
Draft** now explains that backend draft persistence is unavailable; it neither
saves an official invoice locally nor claims the draft can be reopened later.
Working input remains only while the form is open. Preview is available for a
valid form and is marked as unpublished; official server invoices retain their
valid stored metadata for PDF display. The removed duplicate legacy form was
not mounted by any active caller, and contained the other unsafe creation path.

Compatibility changes: local-only students/banks and old local invoice drafts
are no longer official data sources; additional price/discount/item editing is
unavailable; unknown owners, missing official holders, missing schemes, and
invalid schedules require Finance review. No new backend endpoint or contract
relaxation is introduced. Finance/DB PIC must provision verified official
`account_holder` data, register the student with a positive operational fee and
clear payment scheme, and confirm installment schedules before live issuance.
End-to-end issuance against a real configured master is **not verified** here.

Verification commands and results:

- `node tools/student-invoice-test.mjs`: **18 passing regression scenarios**
  covering official/wrong IDs, decimal totals, manual mode, incomplete master,
  installment validity, sync refresh, 422/409/network errors, guarded retry,
  and real-record-only payment/delivery mapping. API calls are mocked.
- `node tools/student-invoice-browser-test.mjs`: **11 passing headless Chrome
  scenarios**, using a temporary Vite fixture and mocked API. Checks include
  read-only fields, preview, manual/draft behavior, database refresh after sync,
  retained form/ID on errors, bank configuration, exact installments, and
  success callbacks only after server confirmation. This is not backend E2E.
  Set `BE012_BROWSER` to another installed Chromium executable if necessary.
- `npm run build` (invoked as `npm.cmd run build` on Windows): passed, including
  Vite, login prerender, and existing backend artifact packaging. Existing
  Browserslist age and plugin timing warnings remain.
- ESLint on the changed application and regression files: wizard, utility,
  and both test files have zero errors/warnings. `InvoicePenagihan.jsx` has
  **26 existing errors**, compared with 27 before this change. A comparison of
  rule/message counts found **zero new findings**. Remaining findings are the
  existing shared component/utility exports and unused-variable reports.
- `git diff --check`: passed. No backend, pricing policy, webhook registration,
  HistoryInvoice, credentials, or production configuration is changed.

### BE-01.1 integration hardening

`sb_link` is the only application writer of `student_invoice_links`. It now
locks the selected source document and validates the owner persisted in its
`student_id` column (when available) and/or `meta_json.student_id`. Conflicting,
malformed, or cross-student ownership returns 409. The target must still be a
registered student with an active student account, and `prepare` permission,
CSRF protection, transaction boundaries, and actor audit remain required.
Request fields cannot establish invoice ownership.

An unlinked legacy billing invoice or `invoice_client` without a known owner
returns 409. Names and email addresses are never used to infer the owner.
Existing legacy relationships can be read and retried for the same student;
they cannot be reassigned. A persisted relationship that contradicts a known
invoice owner also fails on reads and payment-source validation through
`sb_bill`. Finance must review and establish ownership using verified source
records through a separately reviewed data correction; no automatic backfill,
new override endpoint, or migration is included here.

MySQL 1205 inside `ac_atomic` now triggers a **full transaction rollback** and
an `AccountingException` with HTTP 409 and the existing error envelope. This
also applies to linking transactions and other callers of the shared helper.
There is no automatic retry. Reconcile the result before retrying with the same
invoice number; creating a new number can still create a separate debt.

For new billing invoices, select `bank_account_id` from the existing server
bank lookup (`accounting.php?view=lookups`, `banks[].id`). It must refer to an
active `cash_bank_accounts` record backed by an active COA with
`report_class='cash'`. The server snapshots `bank_name`, `account_number`, and
`account_holder` from this record. Optional client copies of those fields are
assertions only and must match exactly after trimming; a mismatch returns 422.
Omit them to use official data. Unknown/inactive bank IDs return 422. Missing
master tables or incomplete official data return 409. Bank IDs in localStorage
or COA codes are not interchangeable with the official bank record ID.

**Deployment dependency:** the existing checked-in `cash_bank_accounts` schema
has bank name and account number, but no verified `account_holder` field. Its
`name` field is an account display label, not verified proof of the legal
holder. Creation therefore fails safely with 409 on that schema even if the
client supplies a holder. A reviewed official holder data source must be
provisioned before enabling new invoice creation; this implementation expects
`cash_bank_accounts.account_holder`. No default holder, hardcoded account,
master-data edit, production configuration change, or migration is introduced.
The regression fixture provides synthetic holder data only in its temporary
database, and explicitly tests the missing-column behavior.

BE-01.1 verification: `php backend/tests/billing_invoice_test.php` passes **103
checks**, including the original cases, actual HTTP ownership/bank validation,
and real MySQL 1205 with separate connections. Timeouts are induced both before
invoice insertion and during audit after invoice/link insertion. Each returns
409, leaves no partial invoice/link/audit, and succeeds on retry after release.
The isolated test router uses a one-second session lock timeout only when the
billing runner's test flag is set; production connection settings are unchanged.
`billing_integration_checks.php` contains the additional regressions, and the
relationship suite's synthetic invoice now includes its verified owner.
Its PHP syntax was checked; the full relationship suite was not executed on
the temporary instance because it requires a complete development schema to
clone, whereas this instance contains only the isolated billing fixtures.

The earlier 63-check result below is the original BE-01 baseline. The unrelated
accounting COA `1100` fixture issue remains outside this hardening change.

Run `php backend/tests/billing_invoice_test.php` with local development/test
configuration (`localhost`/`127.0.0.1`/`::1`, database name ending `_dev` or
`_test`). The runner creates and drops a randomly named test database, reuses the
existing isolated HTTP router, and exercises actual login/session/CSRF and
permissions. It never calls delivery, payment approval, or webhook endpoints.
It covers official fee creation, tampering, discounts, missing students/prices,
duplicate numbers, role overrides, metadata consistency, audit rollback, and
legacy reads. The configured development database supplies connection settings
only; test fixtures and writes are confined to the temporary database.

Verification on local development MySQL:

| Check | Result |
| --- | --- |
| Official fee, server identity, canonical metadata, audit | Passed |
| Tampered/zero/negative/malformed amounts | Passed, 422 |
| Paid/Partially Paid and legacy status aliases | Passed, 422 |
| Unauthorized invoice/item discounts | Passed, 422 |
| Unknown student / missing official pricing | Passed, 404 / 422 |
| Duplicate invoice number, including identical replay | Passed, 409 |
| Anonymous / permission overrides / CSRF | Passed, 401 / 403 |
| Installment consistency and sanitized payment metadata | Passed |
| Missing metadata column / audit failure rollback | Passed, 409 / 500 with no insert |
| Legacy Paid/Lunas, verified payment balances, old row preservation | Passed |
| PHP syntax: billing API, validation service, test runner, shared router | Passed |
| Existing `backend/tests/accounting_test.php` | Failed at line 41: missing fixture COA `1100`, then `ID tidak valid`; later accounting checks did not run |

The BE-01 runner passes 63 checks. The existing accounting suite failure occurs
before the HTTP checks and does not load the new billing service. Its schema
seeding/fixture mismatch is outside BE-01. No frontend build was needed because
no frontend source or imports changed. No delivery endpoint, production
migration/write, commit, or push was performed.

`total_biaya` is an existing operational value, **not proof of upstream pricing
validation**. BE-02 still needs authoritative catalog/policy integration for
website/webhook pricing, discounts, item breakdowns, and commercial installment
rules. Webhook matching and invoice duplication across different invoice
numbers remain existing limitations; BE-01 rejects duplicate invoice numbers
and does not introduce a one-invoice-per-student business rule. Existing
presentation/bank metadata and its official account configuration are not a
pricing authority. No BE-02–BE-05 implementation is included.
