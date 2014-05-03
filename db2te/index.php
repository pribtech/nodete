<!DOCTYPE html>
<html>
<head>
  <title>CF PHP MySQL Demo</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Bootstrap -->
  <link href="css/bootstrap.min.css" rel="stylesheet" media="screen">
</head>
<body>
	<h1>CF PHP MySQL Demo</h1>
	<input type="button" onclick="window.open('init.php');" class="btn" value="Create table"></input>
	<input type="button" onclick="window.open('info.php');" class="btn" value="View PHP info"></input>
	</br>

<?php	
echo '<h2>VCAP_SERVICE Environment variable</h2>';
echo "----------------------------------" . "</br>";
$key = "VCAP_SERVICES";
$value = getenv ( $key );
echo $key . ":" . $value . "</br>";
echo "----------------------------------" . "</br>";
$vcap_services = json_decode($_ENV["VCAP_SERVICES" ]);
$db = $vcap_services->{'mysql-5.5'}[0]->credentials;
$mysql_database = $db->name;
$mysql_port=$db->port;
$mysql_server_name =$db->host . ':' . $db->port;
$mysql_username = $db->username; 
$mysql_password = $db->password; 

$con = mysql_connect($mysql_server_name, $mysql_username, $mysql_password);
if (!$con){
    die ('connection failed' . mysql_error());
}
mysql_select_db($mysql_database,$con);   

$strsq0 = "INSERT INTO ACCESS_HISTORY ( BROWSER, IP_ADDRESS) VALUES
('" . $_SERVER['HTTP_USER_AGENT'] . "', '" . $_SERVER['REMOTE_ADDR'] . "');";
$result0 = mysql_query ( $strsq0 );
if ($result0) {
	//echo "insert success!";
} else {
	echo "Cannot insert into the data table; check whether the table is created, or the database is active.";
}
$strsql = "select * from ACCESS_HISTORY ORDER BY ID DESC limit 100";

$result = mysql_db_query ( $mysql_database, $strsql, $con );

$row = mysql_fetch_row ( $result );

echo '<h2>Access history</h2>';
echo '<table class="table">';
echo "\n<tr>\n";
for($i = 0; $i < mysql_num_fields ( $result ); $i ++) {
	echo '<th>' . mysql_field_name ( $result, $i );
	echo "</th>\n";
}
echo "</tr>\n";

mysql_data_seek ( $result, 0 );

while ( $row = mysql_fetch_row ( $result ) ) {
	echo "<tr>\n";
	for($i = 0; $i < mysql_num_fields ( $result ); $i ++) {
		echo '<td>';
		echo "$row[$i]";
		echo '</td>';
		
	}
	echo "</tr>\n";
}
echo "</table>\n";

mysql_free_result ( $result );
mysql_close();
?>
 <script src="http://code.jquery.com/jquery.js"></script>
  <script src="js/bootstrap.min.js"></script>
</body>
</html>