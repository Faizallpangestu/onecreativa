# FORM QA / SERAH TERIMA SOFTWARE — OneCreativa

> Cetak: buka Markdown preview → Print → Save as PDF. A4 landscape, margin narrow, background graphics on, header/footer off. Jangan menulis password, hash, cookie, token, atau data pribadi ke form ini.

## A. Identitas & cakupan

| Field | Isi |
| --- | --- |
| Sistem | OneCreativa |
| Versi / commit | `<commit>` |
| Tanggal QA | `<YYYY-MM-DD>` |
| Lingkungan | `<lokal / staging url>` |
| Paket rilis | `<path atau hash>` |
| Disiapkan oleh | `<nama QA>` |
| Diterima oleh | `<nama penerima>` |
| Modul tercakup | HRD/GA, Finance, LMS/Sensei/LPK, RPA, Security, Release |
| Keputusan gate | `<GO / NO-GO>` |

| Rekap | Jumlah |
| --- | --- |
| Gate otomatis Pass / Fail / Blocked | `<n> / <n> / <n>` |
| Case matriks Pass / Fail / Blocked / Not Run | `<n> / <n> / <n> / <n>` |
| Persona UAT selesai / blocker | `<n> / <n>` |
| Defect open | `<n>` |

## B. Hasil pengujian

### B1. Gate otomatis

| ID | Check | Perintah | Expected | Actual | Status | Bukti | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GATE-01 | Lint | `npm run lint` | 0 error | `<hasil>` | `<Pass/Fail/Blocked>` | `<path>` | `<DEF/BLK>` |

### B2. Matriks kasus fungsional

Ringkasan per modul (rincian per case ada di `docs/QA_FORM/TEST_CASE_MATRIX.md`).

| Modul | Total | Pass | Fail | Blocked | Not Run | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| `<modul>` | `<n>` | `<n>` | `<n>` | `<n>` | `<n>` | `<catatan>` |

### B3. UAT per persona / role

| Persona | Role | Fokus pengujian | Status | Bukti | Tester / tgl |
| --- | --- | --- | --- | --- | --- |
| `<persona>` | `<role>` | `<fokus>` | `<Pass/Fail/Blocked>` | `<path>` | `<nama / tgl>` |

## C. Daftar temuan (defect)

| ID | Severity | Modul | Deskripsi | Status | Owner | Target | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<DEF-n>` | `<Blocker/Major/Minor>` | `<modul>` | `<deskripsi>` | `<Open/Fixed/Deferred>` | `<owner>` | `<tanggal>` | `<hasil>` |

## D. Limitasi & scope yang tidak diuji

- `<item yang tidak terverifikasi dan alasannya>`
- `<keputusan scope tertulis pemilik sistem, bila ada>`

Dilarang menandai item di bagian D sebagai Pass tanpa bukti baru.

## E. Indeks bukti

| Bukti | Path |
| --- | --- |
| `<nama bukti>` | `<path>` |

## F. Persetujuan

| Peran | Nama | Tanda tangan | Tanggal |
| --- | --- | --- | --- |
| Disiapkan (QA) |  |  |  |
| Diverifikasi (Lead/PO) |  |  |  |
| Diterima (Klien/PO) |  |  |  |

Keputusan penerima: `[ ] Terima` `[ ] Terima dengan catatan` `[ ] Tolak`

Catatan penerima: `<catatan>`
