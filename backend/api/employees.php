<?php
header('Content-Type: application/json; charset=utf-8');
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/employee_directory.php';
$actor=ed_start($conn);$scope=strtolower(trim($_GET['scope']??''));ed_scope($actor,$scope);
if($_SERVER['REQUEST_METHOD']==='GET'){
 if(($_GET['view']??'')==='meta')ed_respond(200,['status'=>'success','data'=>ed_meta($conn,$actor,$scope)]);
 ed_respond(200,['status'=>'success','data'=>ed_rows($conn,$actor,$scope)]);
}
if($_SERVER['REQUEST_METHOD']==='DELETE'){
 $id=isset($_GET['id'])?ac_id($_GET['id']):null;
 $userId=isset($_GET['user_id'])?ac_id($_GET['user_id'],'ID akun'):null;
 $action=strtolower(trim($_GET['action']??''));
 if($scope==='lms'){
  $res=ed_delete_lms($conn,$actor,$id,$userId);
  ed_respond(200,['status'=>'success','message'=>$res['message'],'data'=>$res]);
 }
 if(in_array($action,['delete','force','permanent'],true)||isset($_GET['force'])){
  if(!$id&&$userId){
   $empRow=ac_one($conn,'SELECT id FROM employees WHERE user_id=?',[$userId]);
   if($empRow)$id=(int)$empRow['id'];
   else{
    ac_query($conn,'DELETE FROM users WHERE id=?',[$userId]);
    ed_respond(200,['status'=>'success','message'=>'Akun berhasil dihapus.','data'=>['user_id'=>$userId,'status'=>'deleted']]);
   }
  }
  if(!$id)ac_fail('ID karyawan wajib disertakan.');
  $res=ed_delete_employee($conn,$actor,$id);
  ed_respond(200,['status'=>'success','message'=>$res['message'],'data'=>$res]);
 }
 ac_fail('Riwayat employee harus dipertahankan. Gunakan status Inaktif untuk mengakhiri akses.',409);
}
if(in_array($_SERVER['REQUEST_METHOD'],['POST','PUT'],true)){
 $data=json_decode(file_get_contents('php://input'),true);if(!is_array($data)||array_is_list($data))ac_fail('Body permintaan harus berupa objek JSON.');
 if(($_GET['action']??'')==='relink'){
  $res=ed_relink($conn,$actor,$data);
  ed_respond(200,['status'=>'success','message'=>$res['message'],'data'=>$res]);
 }
 $result=ed_mutate($conn,$actor,$scope,$data,$_SERVER['REQUEST_METHOD']==='POST');
 ed_respond($_SERVER['REQUEST_METHOD']==='POST'?201:200,['status'=>'success','message'=>'Employee dan akun berhasil disimpan.','data'=>$result]);
}
ac_fail('Method tidak didukung.',405);
