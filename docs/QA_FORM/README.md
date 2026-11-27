# QA_FORM

Folder ini berisi seluruh dokumen pengujian dan serah terima OneCreativa. Tidak ada file rahasia di sini; password, hash, cookie, token, dan data pribadi sengaja tidak dicatat.

| File | Isi |
| --- | --- |
| `RINGKASAN_PERUBAHAN.md` | Catatan tunggal untuk semua perubahan kode, runner, tools, dokumen, dan environment selama QA run ini |
| `TEST_CASE_MATRIX.md` | 72 case uji dengan ID stabil, lengkap dengan role, expected, baseline audit, bukti, dan hasil |
| `RUNBOOK.md` | Prasyarat, perintah test, environment variable, dan cara mengisi form |
| `QA_SERAH_TERIMA_TEMPLATE.md` | Form kosong untuk run berikutnya |
| `QA_SERAH_TERIMA_2026-11-27_cbb4c90.md` | Hasil run lokal 2026-11-27 (gate NO-GO) |
| `QA_SERAH_TERIMA_2026-11-27_cbb4c90.xlsx` | Versi Excel dari form dan matriks; sheet `Ringkasan`, `Gate Otomatis`, `Matriks Kasus`, `UAT Persona`, `Defect`, `Bukti`, `Persetujuan`, `Catatan Penerima`, `Form Markdown` |
| `QA_SERAH_TERIMA_2026-11-27_cbb4c90.pdf` | Hasil cetak form Markdown, 5 halaman A4 landscape (223 KB) |
| `evidence/` | Bukti mentah: lint/build/artifact, PHP test, HTTP, browser, UAT, defect dan gate |

## Excel / Google Spreadsheet

File `.xlsx` bisa dibuka langsung di Excel atau di-upload ke Google Sheets melalui **File → Import → Upload**. Untuk membuat ulang setelah form `.md` diperbarui:

```powershell
npm run qa:xlsx
```

Generator membaca form `.md` terbaru dan `TEST_CASE_MATRIX.md`, lalu menimpa file `.xlsx` dengan nama commit/tanggal yang sama.

## Print PDF

Buka file `.md` di Markdown preview → Print → Save as PDF, A4 landscape, margin narrow, background graphics on, header/footer off.

Status terakhir: **NO-GO**. Lihat `evidence/defects-and-gate.md` untuk daftar defect, blocker, dan syarat perpindahan ke GO.
