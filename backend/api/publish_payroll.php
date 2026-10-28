<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
http_response_code(410);
echo json_encode(['status'=>'error','message'=>'Slip gaji tersedia setelah gaji disetujui Admin dan transfer dicatat Finance melalui Penggajian Karyawan.']);
