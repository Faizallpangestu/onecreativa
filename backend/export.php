<?php
require 'config/database.php';

$tables = array();
$result = mysqli_query($conn, "SHOW TABLES");
while($row = mysqli_fetch_row($result)){
  $tables[] = $row[0];
}

$return = "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n";

foreach($tables as $table){
  $result = mysqli_query($conn, "SELECT * FROM ".$table);
  $num_fields = mysqli_num_fields($result);

  $return .= "DROP TABLE IF EXISTS ".$table.";\n";
  $row2 = mysqli_fetch_row(mysqli_query($conn, "SHOW CREATE TABLE ".$table));
  $return .= "\n\n".$row2[1].";\n\n";

  for($i=0; $i<$num_fields; $i++){
    while($row = mysqli_fetch_row($result)){
      $return .= "INSERT INTO ".$table." VALUES(";
      for($j=0; $j<$num_fields; $j++){
        $row[$j] = addslashes($row[$j]);
        $row[$j] = str_replace("\n","\\n",$row[$j]);
        if(isset($row[$j])){
          $return .= '"'.$row[$j].'"';
        } else {
          $return .= '""';
        }
        if($j<($num_fields-1)){
          $return .= ',';
        }
      }
      $return .= ");\n";
    }
  }
  $return .= "\n\n\n";
}
$return .= "SET FOREIGN_KEY_CHECKS = 1;\n";

file_put_contents('../one-creativa-export.sql', $return);
echo "SUCCESS";
?>
