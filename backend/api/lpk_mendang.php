<?php
header('Content-Type: application/json; charset=utf-8');if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/participant_directory.php';
participant_api($conn,'lpk_mendang','mendang');