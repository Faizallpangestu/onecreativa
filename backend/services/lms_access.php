<?php
require_once __DIR__.'/relationships.php';
function lms_actor(mysqli $db,string $resource):array{return rs_start($db);}
function lms_require_meeting(mysqli $db,array $actor,int $id):void{rs_meeting($db,$actor,$id,true);}
