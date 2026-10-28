<?php
function salary_slip_amount($amount): string {
    $cents=salary_cents($amount ?? '0');
    return number_format($cents/100,$cents%100 ? 2 : 0,',','.');
}
function salary_slip_words(int $number): string {
    $words=['Nol','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan','Sepuluh','Sebelas'];
    if ($number<12) return $words[$number];
    if ($number<20) return salary_slip_words($number-10).' Belas';
    if ($number<100) return salary_slip_words(intdiv($number,10)).' Puluh'.($number%10 ? ' '.salary_slip_words($number%10) : '');
    if ($number<200) return 'Seratus'.($number%100 ? ' '.salary_slip_words($number%100) : '');
    if ($number<1000) return salary_slip_words(intdiv($number,100)).' Ratus'.($number%100 ? ' '.salary_slip_words($number%100) : '');
    if ($number<2000) return 'Seribu'.($number%1000 ? ' '.salary_slip_words($number%1000) : '');
    foreach ([1000000000000=>'Triliun',1000000000=>'Miliar',1000000=>'Juta',1000=>'Ribu'] as $unit=>$label) {
        if ($number>=$unit) return salary_slip_words(intdiv($number,$unit)).' '.$label.($number%$unit ? ' '.salary_slip_words($number%$unit) : '');
    }
    return '';
}
function salary_slip_in_words($amount): string {
    $cents=salary_cents($amount);
    return salary_slip_words(intdiv($cents,100)).' Rupiah'.($cents%100 ? ' '.salary_slip_words($cents%100).' Sen' : '');
}
function salary_slip_long_date(?string $date): string {
    if (!$date) return '—';
    $months=[1=>'JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];
    return substr($date,8,2).' '.($months[(int)substr($date,5,2)] ?? '').' '.substr($date,0,4);
}
function salary_slip_logo_path(): string { return __DIR__.'/../resources/salary-logo.png'; }
function salary_slip_logo_uri(): string {
    static $uri;
    return $uri ??= 'data:image/png;base64,'.base64_encode(file_get_contents(salary_slip_logo_path()));
}
function salary_slip_html(array $snapshot): string {
    $snapshot=salary_normalize_totals($snapshot);
    $escape=fn($value)=>htmlspecialchars((string)($value ?? ''),ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
    $income=[['GAJI POKOK',$snapshot['base_salary']],['TRANSPORT',$snapshot['transport_allowance']],['UANG MAKAN',$snapshot['meal_allowance']],['THR',$snapshot['thr_amount']]];
    $deductions=[['KASBON',$snapshot['kasbon_deduction']],['BPJS KETENAGAKERJAAN',$snapshot['bpjs_tk_deduction']],['BPJS KESEHATAN',$snapshot['bpjs_kes_deduction']],['IZIN / SAKIT',$snapshot['leave_deduction']]];
    $paid=($snapshot['payment_status'] ?? '')==='paid';
    $payment=$paid ? 'Transfer dicatat pada '.salary_slip_long_date($snapshot['paid_date']).' · Referensi '.$snapshot['transfer_reference'] : 'Gaji disetujui Admin · Transfer belum dicatat · Jadwal gajian '.salary_slip_long_date($snapshot['payday']);
    ob_start(); ?>
<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Slip Gaji <?= $escape($snapshot['month']) ?></title>
<style>
*{box-sizing:border-box}body{margin:0;background:#fff;color:#000;font:13px/1.45 Arial,sans-serif}.slip{width:100%;max-width:794px;margin:0 auto;padding:42px 28px 24px}.letterhead{display:flex;align-items:flex-start;gap:16px;margin-bottom:20px}.logo{width:116px;height:116px;object-fit:contain;flex-shrink:0}.company{flex:1;min-width:0;padding:7px 0 2px;border-bottom:2px solid #000}.company h1{font-size:19px;line-height:1.25;margin:0 0 4px;font-weight:700}.company p{font-size:13px;margin:2px 0}.document-date{text-align:right;white-space:nowrap;padding-top:7px;min-width:148px}.document-date h2{margin:0 0 2px;font-size:19px}.document-date p{font-size:15px;font-style:italic;margin:0}.identity{border-collapse:collapse;margin:0 0 14px;width:100%}.identity td{padding:1px 4px;vertical-align:top}.identity td:first-child{width:140px}.identity td:nth-child(2){width:32px}.identity td:last-child{overflow-wrap:anywhere}table{width:100%;border-collapse:collapse}.components{table-layout:fixed;border-top:1px solid #000}.components th{text-align:left;font-size:13px;border-bottom:3px double #000;padding:1px 4px}.components .gap{width:15%;border:0}.components .label{width:31%}.components .value{width:11.5%;text-align:right;white-space:nowrap}.components td{padding:1px 4px;vertical-align:top}.components .line{border-bottom:1px dashed #000}.components .spacer td{height:18px}.components .sum td{border-top:3px double #000;border-bottom:3px double #000;font-weight:700}.sum-label{white-space:nowrap}.rp{float:right;margin-left:4px}.net{display:grid;grid-template-columns:170px minmax(0,255px) 1fr;gap:2px;margin-top:18px;align-items:start}.net-label{font-weight:700;padding:5px 4px}.net-value{font-weight:700;border:2px solid #000;display:flex;justify-content:space-between;gap:15px;padding:1px 12px;width:max-content;min-width:138px}.words{font-weight:700;font-style:italic;border:2px solid #000;padding:2px 4px;margin-top:-2px;line-height:1.3;overflow-wrap:anywhere}.signature{text-align:center;padding:5px 0;min-height:75px}.signature small{display:block;margin-top:38px}.details{margin-top:25px;padding-top:10px;border-top:1px solid #ddd;color:#444;font-size:10px;line-height:1.6}.details p{margin:2px 0;overflow-wrap:anywhere}.details .status{font-weight:700;color:#111}.details .meta{margin-top:5px}.details-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:600px){.slip{padding:18px 12px}.letterhead{flex-wrap:wrap;gap:10px}.logo{width:72px;height:72px}.company h1{font-size:14px}.company p{font-size:10px}.company{padding:0 0 3px}.document-date{width:100%;padding:0;display:flex;justify-content:space-between;align-items:center}.document-date h2{font-size:16px}.document-date p{font-size:12px}.identity{font-size:11px}.identity td:first-child{width:112px}.identity td:nth-child(2){width:16px}.components{font-size:10px}.components th{font-size:11px}.components .gap{width:3%}.components .label{width:33.5%}.components .value{width:15%}.components .sum-label{white-space:normal}.components td,.components th{padding:2px}.components .value{white-space:normal;overflow-wrap:anywhere}.net{grid-template-columns:90px minmax(0,1fr);font-size:11px;gap:4px}.net-value{min-width:120px}.signature{grid-column:2}.details-grid{grid-template-columns:1fr}}
@page{size:A4 portrait;margin:10mm}@media print{body{background:white}.slip{max-width:none;padding:0}.letterhead,.components,.net,.details{break-inside:avoid}}
</style></head><body><main class="slip">
<header class="letterhead"><img class="logo" src="<?= salary_slip_logo_uri() ?>" alt="Logo Creativa Bridging International"><div class="company"><h1>CREATIVA BRIDGING INTERNATIONAL</h1><p>PANEMBONG GIRANG, MEKARSARI</p><p>Kp. Panembong Girang No. 23 RT.03/RW.04</p><p>Desa Mekarsari Cianjur - Jawa Barat</p><p>Telp. +628152222672 - email: cbinfo1811@gmail.com</p></div><div class="document-date"><h2>Slip Gaji</h2><p><?= $escape(salary_slip_long_date($snapshot['payday'])) ?></p></div></header>
<table class="identity"><tr><td>NAMA / NIK</td><td>:</td><td><?= $escape($snapshot['employee_name']) ?> / <?= $escape($snapshot['employee_code']) ?></td></tr><tr><td>JABATAN</td><td>:</td><td><?= $escape($snapshot['position_name']) ?></td></tr><tr><td>TGL MULAI KERJA</td><td>:</td><td><?= $escape(salary_slip_long_date($snapshot['employee_join_date'] ?? null)) ?></td></tr></table>
<table class="components"><colgroup><col class="label"><col class="value"><col class="gap"><col class="label"><col class="value"></colgroup><thead><tr><th colspan="2">PENDAPATAN</th><th class="gap"></th><th colspan="2">POTONGAN</th></tr></thead><tbody>
<?php foreach ($income as $index=>[$label,$amount]): ?><tr><td class="line">- <?= $escape($label) ?></td><td class="value line"><?= salary_slip_amount($amount) ?></td><td class="gap"></td><td class="line">- <?= $escape($deductions[$index][0]) ?></td><td class="value line"><?= salary_slip_amount($deductions[$index][1]) ?></td></tr><?php endforeach ?>
<tr class="spacer"><td colspan="5"></td></tr><tr class="sum"><td class="sum-label">JUMLAH PENDAPATAN <span class="rp">Rp</span></td><td class="value"><?= salary_slip_amount($snapshot['gross_salary']) ?></td><td class="gap"></td><td class="sum-label">JUMLAH POTONGAN <span class="rp">Rp</span></td><td class="value"><?= salary_slip_amount($snapshot['total_deductions']) ?></td></tr></tbody></table>
<section class="net"><div class="net-label">GAJI BERSIH</div><div><div class="net-value"><span>Rp</span><span><?= salary_slip_amount($snapshot['total_salary']) ?></span></div><div class="words">( <?= $escape(salary_slip_in_words($snapshot['total_salary'])) ?> )</div></div><div class="signature">Mengetahui,<small><?= $escape($snapshot['reviewed_by_name']) ?></small></div></section>
<footer class="details"><p class="status"><?= $escape($payment) ?></p><div class="details-grid"><div><p>Periode absensi: <?= $escape($snapshot['month']) ?> · Hadir: <?= $escape($snapshot['work_days']) ?> hari</p><p>Makan: <?= $escape($snapshot['work_days']) ?> × Rp <?= salary_slip_amount($snapshot['meal_rate']) ?> · Transport: <?= $escape($snapshot['work_days']) ?> × Rp <?= salary_slip_amount($snapshot['transport_rate']) ?></p><p>Rekening: <?= $escape($snapshot['bank_name']) ?> · <?= $escape($snapshot['account_number']) ?> · a.n. <?= $escape($snapshot['account_name']) ?></p></div><div><p>BPJS TK (nomor peserta): <?= $escape(($snapshot['bpjs_tk_number'] ?? '') ?: 'Belum diisi') ?></p><p>BPJS Kesehatan (nomor peserta): <?= $escape(($snapshot['bpjs_kes_number'] ?? '') ?: 'Belum diisi') ?></p><p>Email: <?= $escape($snapshot['recipient_email']) ?></p></div></div><?php if ($snapshot['adjustment_note']!==''): ?><p class="meta">Catatan Finance: <?= $escape($snapshot['adjustment_note']) ?></p><?php endif ?><p class="meta">GAJI-<?= str_pad((string)$snapshot['id'],6,'0',STR_PAD_LEFT) ?> · Disetujui <?= $escape($snapshot['reviewed_by_name']) ?> pada <?= $escape($snapshot['reviewed_at']) ?>. Potongan mengikuti nominal manual Finance yang disetujui Admin.</p></footer>
</main></body></html>
<?php return ob_get_clean();
}
