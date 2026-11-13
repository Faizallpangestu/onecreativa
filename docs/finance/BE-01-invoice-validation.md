# BE-01: server-side invoice validation

## Scope and existing flows

- `POST /api/billing.php`, action `add_invoice`, is called by
  `src/components/BuatInvoiceWizardModal.jsx` and the legacy invoice form in
  `src/pages/InvoicePenagihan.jsx`. Both currently omit `student_id`; the legacy
  form also permits arbitrary customer names, prices, discounts, and statuses.
  Both callers must adopt the contract below. No frontend files are changed here.
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
