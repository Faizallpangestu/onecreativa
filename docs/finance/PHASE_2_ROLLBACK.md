# Phase 2 rollout and rollback

All schema changes are additive. No legacy finance/payment/account/student/employee records are deleted or automatically posted. New COA entries are configurable master data. Selected existing source files were backed up before modification under `backend/storage/backups/phase2-*`; this is not a complete source release backup. Database dumps there are private and must never be packaged for hosting.

1. Read `PHASE_2_IMPLEMENTATION.md` for verified scope and limitations; run the migration with `--dry-run`, integration tests and frontend build first.
2. Back up the target database and all attachments; verify restore in a separate database. The provided local backup is not a production backup.
3. Run budget migration (if not installed), then `php backend/migrations/finance_traceability.php`. Do not restore the dump into an active production database; it is for a new empty restore database.
4. Deploy compatible backend/frontend together. Do not deploy a partial `dist` or publish diagnostics/tests/backups.
5. Before journals exist, code rollback may restore selected changed files available in the saved source snapshot. Use a separately verified release backup for files not in that snapshot, and deploy compatible frontend/backend together. Keep additive tables and columns. Restore budget workflow only with financial write access disabled: its old approval creates false income.
6. After posting, reverse/adjust journals with authorized operations; never DROP tables, delete journal lines, overwrite finance records, or restore old data over newer transactions. Prefer a forward fix.
7. Stop affected writes before investigation. Preserve audit/idempotency/source links and evidence files. Recovery from backup must include reconciling all transactions created after its timestamp.

Production migration, destructive repair, reclassification of history, and bank opening balances require explicit approval after a concrete dry-run and verified rollback. This work does not authorize deletion of any user's existing data.
