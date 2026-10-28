<?php
header('Content-Type: application/json; charset=utf-8');if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/matching.php';
foreach(['lpk_matching_job','matching_student_links','matching_candidate_history']as $table)if(!ac_table($conn,$table))ac_fail('Migrasi relasi kandidat belum tersedia.',503);
$hasJobs=ac_table($conn,'matching_jobs');

if($_SERVER['REQUEST_METHOD']==='GET'){
 if(($_GET['view']??'')==='jobs'){
  if(!$hasJobs)ed_respond(200,['status'=>'success','data'=>[],'total'=>0]);
  $jobs=ac_rows($conn,"SELECT j.*,(SELECT COUNT(*) FROM lpk_matching_job c WHERE c.job_id=j.id) AS total_kandidat,(SELECT COUNT(*) FROM lpk_matching_job c WHERE c.job_id=j.id AND c.progress='Siap Terbang') AS total_siap_terbang,(SELECT COUNT(*) FROM lpk_matching_job c WHERE c.job_id=j.id AND c.progress IN ('Lolos Interview','Proses MCU','Pengajuan CoE','Pengajuan Visa')) AS total_lolos,(SELECT GROUP_CONCAT(DISTINCT NULLIF(c.lpk_pengirim, '') SEPARATOR ', ') FROM lpk_matching_job c WHERE c.job_id=j.id) AS lpk_pengirim_list FROM matching_jobs j ORDER BY j.created_at DESC");
  foreach($jobs as &$jb){
   $dec=json_decode($jb['include_items']??'',true);
   $jb['include_items_array']=is_array($dec)?$dec:[];
   $jb['candidates']=ac_rows($conn,'SELECT id,nama_lengkap,usia,lpk_pengirim,progress,created_at FROM lpk_matching_job WHERE job_id=? ORDER BY id DESC',[(int)$jb['id']]);
  }
  unset($jb);
  ed_respond(200,['status'=>'success','data'=>$jobs,'total'=>count($jobs)]);
 }
 if(($_GET['view']??'')==='lpk_list'){
  $distinct=ac_rows($conn,"SELECT DISTINCT TRIM(lpk_pengirim) AS lpk_name FROM lpk_matching_job WHERE lpk_pengirim IS NOT NULL AND TRIM(lpk_pengirim)<>'' ORDER BY lpk_name");
  $preset=['LPK Creativa Bridging International','LPK SAGARA','LPK AOKI GAKKOU','LPK PRAMUDITA','LPK ASSAHI BUNTONI','LPK INSAN CITA INTERNATIONAL','LPK JGI','LPK ORI','LPK ONEGAI'];
  $existing=array_map(fn($r)=>$r['lpk_name'],$distinct);
  $merged=array_values(array_unique(array_merge($preset,$existing)));
  ed_respond(200,['status'=>'success','data'=>$merged]);
 }
}

$a=ed_start($conn);if(!in_array($a['role'],['admin','super_admin','lpk'],true))ac_fail('Akses kandidat tidak diizinkan.',403);

if($_SERVER['REQUEST_METHOD']==='GET'){
 if(isset($_GET['id'])){$r=mk_access($conn,$a,ac_id($_GET['id']));if(($_GET['view']??'')==='file'){$field=$_GET['field']??'';if(!in_array($field,['foto','file_cv','file_jft','file_ssw','file_jlpt'],true))ac_fail('Dokumen tidak valid.');rs_file('matching',$r[$field]??'','matching');}if(($_GET['view']??'')==='history')ed_respond(200,['status'=>'success','data'=>ac_rows($conn,'SELECT action,previous_status,next_status,notes,actor_id,created_at FROM matching_candidate_history WHERE candidate_id=? ORDER BY id',[(int)$r['id']])]);}
 if(($_GET['view']??'')==='students')ed_respond(200,['status'=>'success','data'=>ac_rows($conn,'SELECT id,nama_lengkap AS name,email,no_wa FROM peserta_intensif ORDER BY nama_lengkap')]);
 $sql=$hasJobs
  ?'SELECT c.*,l.student_id,j.job_title,COALESCE(NULLIF(j.source_type,""),"TSK") AS source_type,COALESCE(NULLIF(c.tsk_name,""),j.source_name,"") AS source_name,j.source_pic,j.source_contact,j.lokasi_jepang,COALESCE(c.biaya_matching,j.total_biaya,0) AS biaya_matching_efektif,j.total_biaya AS job_total_biaya,j.currency AS job_currency,j.include_items AS job_include_items,j.include_custom AS job_include_custom,j.exclude_items AS job_exclude_items,j.estimasi_gaji AS job_estimasi_gaji,j.status AS job_status FROM lpk_matching_job c LEFT JOIN matching_student_links l ON l.candidate_id=c.id LEFT JOIN matching_jobs j ON j.id=c.job_id WHERE '.(rs_admin($a)?'1=1':"EXISTS(SELECT 1 FROM matching_candidate_history h WHERE h.candidate_id=c.id AND h.action='created' AND h.actor_id=".(int)$a['id'].')').' ORDER BY c.created_at DESC'
  :'SELECT c.*,l.student_id FROM lpk_matching_job c LEFT JOIN matching_student_links l ON l.candidate_id=c.id WHERE '.(rs_admin($a)?'1=1':"EXISTS(SELECT 1 FROM matching_candidate_history h WHERE h.candidate_id=c.id AND h.action='created' AND h.actor_id=".(int)$a['id'].')').' ORDER BY c.created_at DESC';
 $rows=ac_rows($conn,$sql);
 foreach($rows as &$r){
  $r['verification']=[];
  foreach(['file_cv','file_jft','file_ssw','file_jlpt']as $field)$r['verification'][$field]=mk_verified($conn,(int)$r['id'],$r,$field);
  $jobIncludes=json_decode($r['job_include_items']??'',true);
  $customIncludes=json_decode($r['include_fasilitas']??'',true);
  $r['effective_includes']=is_array($customIncludes)?$customIncludes:(is_array($jobIncludes)?$jobIncludes:[]);
 }
 unset($r);
 ed_respond(200,['status'=>'success','data'=>$rows,'total'=>count($rows)]);
}
if($_SERVER['REQUEST_METHOD']==='POST'){
 $d=json_decode(file_get_contents('php://input'),true)??$_POST;
 if(!is_array($d))ac_fail('Data tidak valid.');
 $action=$d['action']??'';
 if(in_array($action,['create_job','update_job','delete_job'],true)){
  if(!$hasJobs)ac_fail('Tabel lowongan belum tersedia.',503);
  $r=mk_mutate_job($conn,$a,$d);
  ed_respond(200,['status'=>'success','id'=>$r['id'],'data'=>$r]);
 }
 $r=mk_mutate($conn,$a,$d);
 ed_respond(200,['status'=>'success','id'=>$r['id'],'data'=>$r]);
}
if($_SERVER['REQUEST_METHOD']==='DELETE')ac_fail('Histori kandidat dipertahankan. Gunakan progress Gagal / Batal dengan catatan.',409);
ac_fail('Metode tidak diizinkan.',405);
