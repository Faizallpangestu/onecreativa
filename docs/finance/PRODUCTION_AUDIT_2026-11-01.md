# Audit teknis keuangan production — 1 November 2026

## Kesimpulan

**NO-GO untuk publikasi sebagai laporan akuntansi resmi/final.** Data historis ada, tetapi belum menjadi jurnal double-entry. Pemeriksaan ini adalah audit teknis terbatas atas database production dan kode lokal, bukan opini audit independen atau sertifikasi SAK/IFRS. Tidak ada data production yang diubah. Versi kode yang sedang terpasang di hosting belum dibandingkan byte-for-byte dengan lokal.

## Bukti database

Sumber: SELECT read-only melalui phpMyAdmin, database `u260890310_one`.

| Pemeriksaan | Hasil |
|---|---:|
| finance_records | 341 |
| Pemasukan seluruh periode | 78 / Rp350.951.921 |
| Pengeluaran seluruh periode | 263 / Rp350.951.921 |
| Pemasukan 2025 | 6 / Rp26.015.000 |
| Pengeluaran 2025 | 22 / Rp15.815.000 |
| Pemasukan 2026 | 72 / Rp324.936.921 |
| Pengeluaran 2026 | 241 / Rp335.136.921 |
| accounting_transactions | 0 |
| journal_entries / journal_lines | 0 / 0 |
| accounting_source_documents / payment_allocations | 0 / 0 |
| billing_invoices / billing_pembayaran | 0 / 0 |
| invoice_records | 1 |
| Client ID 2: tagihan / pembayaran tercatat / sisa aritmetis | Rp36.000.000 / Rp20.000.000 / Rp16.000.000 |
| Tanpa referensi photo_path maupun drive_link | 12 pemasukan + 33 pengeluaran |
| Nominal <= 0 / tanggal NULL pada finance_records | 0 / 0 |
| Duplikasi persis type+amount+transaction_date+description | 0 kelompok |
| Pembayaran invoice tanpa client | 0 |
| Rekening dengan COA hilang/bukan cash | 0 |
| Periode akuntansi | 24 open, Januari 2026–Desember 2027 |

Tidak adanya duplikasi persis tidak membuktikan tidak ada pembayaran ganda lintas sumber. Referensi bukti yang terisi belum membuktikan file tersedia atau sah. Pembayaran Rp20 juta belum dicocokkan ke bank maupun kemungkinan pencatatan yang sama di finance_records; jangan menjumlahkannya otomatis.

Selisih mutasi 2026 adalah minus Rp10.200.000. Selisih mutasi 2025 adalah plus Rp10.200.000. Ini menjelaskan kemungkinan carry-forward, tetapi **bukan bukti saldo bank nol atau saldo awal terverifikasi**. Pemasukan kategori Modal berjumlah Rp292.177.465 pada seluruh periode; tidak boleh otomatis menjadi pendapatan jasa/laba.

## Temuan prioritas

### P0 — Catatan kas belum terhubung ke jurnal

341 catatan lama masih tersimpan, sementara seluruh jurnal dan transaksi akuntansi baru kosong. Laporan yang membaca posted journal tidak mencakup catatan tersebut. Nol debit dan nol kredit tidak membuktikan laporan lengkap.

Kode laporan memang membatasi sumber pada jurnal posted dan menyatakan coverage belum lengkap: [accounting_reports.php](../../backend/services/accounting_reports.php). Kontrol posting mencakup keseimbangan debit-kredit, periode terbuka, dan reversal: [accounting_journal.php](../../backend/services/accounting_journal.php). Keberadaan kontrol kode belum membuktikan data historis sudah melewatinya.

Tindakan: mapping setiap sumber ke akun lawan/rekening/jenis transaksi, verifikasi bukti dan duplikasi, siapkan draft migrasi yang mempertahankan ID asli, kemudian review dan posting melalui workflow. Jangan mengisi jurnal otomatis dengan akun tebakan atau menjadikan selisih sebagai pendapatan.

### P0 — Rekonsiliasi masih menggunakan data browser dan saldo bawaan

Route aktif `/reconciliation` memakai [ReconciliationPage.jsx](../../src/pages/finance/ReconciliationPage.jsx), yang mempunyai default invoice, default saldo bank, localStorage, dan fallback saldo awal Rp120 juta. Saldo bank dihitung dari mutasi internal. Ini belum merupakan perbandingan independen dengan rekening koran.

Tindakan: hilangkan fallback fiktif production; gunakan saldo awal terverifikasi, impor statement bank, pencocokan eksplisit, penyimpanan hasil di backend, approval dan audit trail. Data belum tersedia harus ditampilkan sebagai belum terverifikasi, bukan saldo contoh.

### P1 — Batas 200 baris membuat total detail tidak lengkap

[finance_dashboard.php](../../backend/api/finance_dashboard.php) membatasi daftar legacy realisasi `LIMIT 200`, lalu UI menghitung KPI dari daftar itu di [DashboardFinance.jsx](../../src/pages/DashboardFinance.jsx).

Reproduksi SELECT production untuk tahun 2026, urut transaction_date DESC dan LIMIT 200:

- income: 45, Rp160.324.515;
- expense: 155, Rp179.444.559.

Seluruh tahun memiliki 313 catatan, sehingga 113 tidak masuk daftar terbatas. Urutan tanggal tanpa tie-break ID juga tidak deterministik untuk tanggal sama. Angka pengeluaran hasil pemeriksaan kini berbeda Rp2.500 dari screenshot lama; penyebab perubahan historis belum diketahui.

Tindakan: hitung agregat dari dataset/filter lengkap di server; paginasi hanya untuk tampilan; gunakan urutan tanggal+ID; uji >200 baris dan perbandingan KPI/export/detail.

### P1 — Status, tanggal bayar, rekening dan proyeksi diasumsikan

Dashboard memberi legacy `approved`, `paid`, dan menggunakan `created_at` sebagai `paid_at`, walaupun skema finance_records tidak menyimpan status pembayaran/approval. Buku transaksi di [accounting_ledger.php](../../backend/services/accounting_ledger.php) justru menandai legacy unknown/needs_review. Beberapa sumber menggunakan rekening BCA literal. Copy `PROJ-...` dari realisasi dibuat untuk audit tetapi bukan bukti rencana yang pernah disetujui.

Tindakan: pisahkan status pembayaran dari status verifikasi; jangan menampilkan waktu input sebagai waktu bank; rekening tidak diketahui harus unknown. Riwayat proyeksi rekonstruksi boleh ditampilkan dengan label eksplisit dan tidak dihitung sebagai dana masa depan.

### P1 — Invoice cicilan dan jatuh tempo tidak konsisten

Client ID 2 memiliki Rp36 juta tagihan dan Rp20 juta pembayaran tercatat, tetapi query proyeksi client memberi status literal unpaid dan hanya menampilkan sisa Rp16 juta. Skema invoice_clients belum memiliki due_date, dan dashboard memakai created_at sebagai tanggal proyeksi. Karena itu belum dapat menyatakan jadwal penerimaan bulanan atau overdue secara andal.

Tindakan: sumber tagihan/jadwal cicilan dengan due_date dan ID tetap; status partial berdasarkan pembayaran terverifikasi; realisasi mengikuti tanggal pembayaran masing-masing; outstanding = tagihan dikurangi pembayaran bersih/refund/koreksi. Pembayaran yang belum terjadi boleh tampil sebagai baris audit berjumlah realisasi 0, bukan kas diterima.

### P1 — Bukti transaksi dan periode historis

45 catatan tidak mempunyai referensi bukti. Data dimulai November 2025 tetapi periode baru dibuka mulai Januari 2026. Migrasi historis perlu keputusan cutover: posting historis dalam periode berwenang atau saldo awal terverifikasi; jangan backdate ke periode lain agar lolos validasi.

### P2 — Pemeriksa audit dapat menyembunyikan error

[check_counts.php](../../check_counts.php) mengembalikan 0 saat query gagal. Karena itu output nol dari script tersebut tidak boleh dianggap lulus audit tanpa memeriksa kegagalan query. Pemeriksaan production ini memakai hasil SELECT langsung, bukan script tersebut.

## Alur target

1. Dokumen rencana/tagihan dengan tanggal jatuh tempo dan persetujuan.
2. Pengakuan piutang/utang hanya jika syarat pengakuan terpenuhi; proyeksi semata bukan jurnal kas.
3. Pembayaran nyata + rekening + tanggal + bukti; alokasi ke tagihan/cicilan.
4. Verifikasi dan approval terpisah, posting jurnal double-entry atomik/idempotent.
5. GL, neraca saldo, laba rugi, neraca dan cash flow dari sumber jurnal yang sama.
6. Rekonsiliasi bank independen, koreksi melalui reversal/adjustment, closing dan audit trail.

Panel proyeksi penerimaan dapat khusus inflow sesuai kebutuhan pengguna. Laporan cash flow resmi tetap mencakup kas masuk dan keluar dengan klasifikasi operasi, investasi dan pendanaan. Modal masuk bukan pendapatan jasa; transfer antarrekening internal bukan pendapatan/beban. Pembayaran siswa tidak otomatis seluruhnya menjadi pendapatan saat kas diterima; pengakuan mengikuti layanan dan kebijakan yang berlaku.

## Standar dan batas pemeriksaan

- [IAI — SAK Entitas Privat](https://web.iaiglobal.or.id/Berita-IAI/detail/standar_akuntansi_keuangan_indonesia_untuk_entitas_privat): merujuk IFRS for SMEs, efektif 2025. Pemilihan SAK Indonesia, SAK EP, atau standar lain harus disesuaikan dengan entitas; tidak boleh mengklaim semua standar sekaligus.
- [IFRS — IAS 7](https://www.ifrs.org/issued-standards/list-of-standards/ias-7-statement-of-cash-flows/): klasifikasi operasi/investasi/pendanaan dan rekonsiliasi kas.
- [IFRS — IFRS 15](https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/): pengakuan pendapatan ketika kewajiban pelaksanaan terpenuhi.

Belum diperiksa: bukti bank eksternal, saldo awal nyata, keaslian seluruh lampiran, pajak, kelengkapan aset/depresiasi, payroll per pegawai, kewajiban yang belum dicatat, kontrak layanan, seluruh endpoint/otorisasi melalui pengujian runtime, dan kesamaan build production-lokal. Tidak dilakukan build atau perubahan fungsi pada audit ini. Perubahan dashboard yang sudah ada di working tree dipertahankan.

## Syarat keluar NO-GO

- Seluruh sumber historis dipetakan tanpa hilang/duplikat dan disetujui finance.
- Tidak ada saldo dummy atau data localStorage sebagai sumber laporan production.
- Jumlah/nominal KPI, daftar lengkap dan export sama untuk scope/filter sama.
- Dokumen, cicilan, pembayaran, jurnal dan hover terhubung memakai ID sumber.
- Saldo awal dan akhir cocok rekening koran; selisih dijelaskan dan disetujui.
- Laporan posted journal lengkap, debit-kredit seimbang, aset=liabilitas+ekuitas, serta cash flow cocok perubahan kas.
- Standar pelaporan, pengakuan pendapatan, cutover dan penutupan periode disetujui penanggung jawab finance.

Posting/migrasi production belum dilakukan: membutuhkan mapping dan bukti yang belum tersedia, bukan hanya perubahan tampilan.
