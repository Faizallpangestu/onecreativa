# QA/UAT Phase 5–16

Automated checks menggunakan synthetic isolated databases; bukan data operasional atau hosting. Browser/mobile/UAT masih **NOT VERIFIED**. Untuk retrieval browser lokal: Apache/MySQL aktif, `npm run dev`, login sesuai akun nyata di `http://localhost:5173/employees`; jangan memakai halaman bundle hosting lama sebagai bukti source baru telah terdeploy. Mutating manual QA harus memakai database staging/fixture yang disetujui, bukan employee/finance asli.

| Module | Scenario | Evidence/status | Manual acceptance / next dependency |
| --- | --- | --- | --- |
| HRD | Existing staff retrieval, search, department filter, pagination, detail | API real DB + fixture PASS; browser NOT VERIFIED | 8 original profiles accounted: 6 staff including orphan, 2 learner profiles scope LMS; no silent empty on error |
| HRD | New employee, mandatory identity/password, date/phone/salary, position/department | API PASS; browser NOT VERIFIED | Returned ID; no default password; invalid/email/duplicate/FK rejected; responsive modal and password masked |
| HRD | Edit inactive, empty password, omitted fields, role change | API + UI unit PASS; browser NOT VERIFIED | Active 0 and original date/phone preserved; HR cannot assign privileged roles; no role creation |
| HRD | Inactivation, account access, payroll history | Session/regression PASS | Old session denied while inactive; salary/payslip snapshots/history remain; no delete cascade |
| HRD | Salary confidentiality, self profile/photo, orphan recovery | API PASS; recovery NOT EXECUTED | Finance cannot read other private employee; LPK salary masked; image type/content safe; orphan not recreated |
| HRD | Leave approval, self approval, role spoof, duplicate, conflict | Automated subset PASS | NULL worked timestamps, one balance deduction, existing attendance preserved; exact reviewer roles Super/manager from existing rule |
| HRD | Face/RFID, full attendance UI, leave upload, overtime, HRD payroll UI | NOT VERIFIED | Browser/device E2E and authorization matrix before UAT |
| Finance | Capital, loan, direct revenue, advance/deferred, earned revenue | Accounting fixture PASS | Compare balances/GL/TB/P&L/CF; modal/loans do not become revenue |
| Finance | Invoice AR/partial payment, vendor bill, payroll/reimbursement settlement | Accounting/salary fixture PASS | Source amounts and outstanding reconcile; no second expense/revenue; legacy actual review remains |
| Finance | RAB approval, commitment, partial realization, race, cancellation/close | Budget/accounting fixture PASS | Approval noncash; item cap, actual transaction/journal link; no duplicate |
| Finance | Asset, transfer, reversal, period close, cash history | Accounting fixture PASS | Transfer consolidated zero, reversal linked, balanced posted journal, immutable audit |
| Finance | Ledger detail/filter/numeric CSV/Excel/private proof | API/build PASS; browser export NOT VERIFIED | IDs/sources and filtered amounts identical; no permission bypass/private cache |
| Finance | Restricted Admin approval policy | Service/direct HTTP PASS | Admin cannot grant own approve; policy changes Super Admin only; Director actual account absent |
| Finance | Real historical review/saldo awal/bank reconcile/hosting | NOT VERIFIED | Explicit approval/document review and external reconcile; coverage stays incomplete |
| Sensei | Own classes/student roster/schedule week/timezone | FAIL/PARTIAL baseline; schema approval pending | Explicit class/enrollment/assignment; no count all students; unavailable comparator clearly labeled |
| Sensei | Barcode attendance/late/leave/absence; match learner history | PARTIAL | Real attendance session + enrollment; duplicate protection; no invented check-ins/KPI |
| Sensei | Tasks/submissions/grading | Phase 2 guard subset PASS; full flow NOT VERIFIED | Own class/assignment only, deadline policy, complete grade preview and publication |
| Sensei | Quiz/UKOM/consultation and selected-period dashboard | NOT VERIFIED | Full category/publication flow, same period numerator/denominator, zero-safe rates |
| LMS | Login/self profile/identity/batch/class/student card | Profile identity guard PASS; enrollment/card NOT VERIFIED | Account → student ID → enrolled class; don't infer by name/email; other student denied |
| LMS | `/dashboard-siswa-intensif` sources/schedule/learning KPIs | FAIL baseline | Replace localStorage operational data after class relationships approved; retain design |
| LMS | Attendance / task published / receive / submit / graded / published | PARTIAL | Entire scenario in isolated class fixture after schema approval; incomplete grades hidden; uploads/deadlines/retries |
| LMS | Quiz/UKOM grades publication | NOT IMPLEMENTED/PARTIAL | Publication metadata/schema; published outcomes only to actual class members |
| LMS | Own financial bills/installments/outstanding/payment history | NOT IMPLEMENTED | Student invoice owner link + verified/posted allocation; receipt submission is not verified payment |
| Matching | Session/read permission/no physical delete | API PASS | Admin/Super/LPK only; Finance/student direct calls denied |
| Matching | Candidate create/edit/student reuse/external LPK/progress | NOT VERIFIED | Optional reviewed internal link; external profile allowed; duplicates and persisted status history |
| Matching | CV/JFT/SSW upload, verification, filter, Excel export | NOT VERIFIED | Private delivery/authorization, real certificates not inferred from filename, safe filtered export |
| Shared | All original data/schema/roles | Hash/backup comparison PASS | 61 table row hashes unchanged; 45 original table values preserved; no migration/recovery auto-applied |
| Shared | Error/network/session expiry/retry | Employee helper/API subset PASS; other modules PARTIAL | Failures visible with actionable ID; no fake zero/empty/success; retry without duplicate account |
| Shared | Mobile/modal scroll/table horizontal overflow/keyboard focus | NOT VERIFIED | Review existing navbar/sidebar/logo, modal focus/close/save disabled, labels/date/currency, responsive widths |

Mandatory security matrix: employee tests cover learner/Finance private profile isolation, HRD financial deny, inactive session, direct API + CSRF bypass, role spoof, and Admin permission self-grant. Sensei unassigned-class reads and complete grade/publication/student billing isolation remain pending class/owner relationships. Phase 2 tests only prove current teacher meeting ownership for grading/deleting; they do not certify the full enrollment matrix.

Approval gate follows user's instruction: migrations, recovery, historic finance correction and destructive operations require explicit approval. `PROPOSED_RELATIONSHIPS.sql` is review-only; no execute command is provided here.
