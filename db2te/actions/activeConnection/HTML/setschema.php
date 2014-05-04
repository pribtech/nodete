<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2007 All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *********************************************************************************/
$schemaToSet = isset($_GET['setSchema']) ? $_GET['setSchema'] : (isset($_POST['setSchema']) ? $_POST['setSchema'] : null);
if($schemaToSet != null)
{
	TE_session_start();
	$_SESSION['Connections'][USE_DATABASE_CONNECTION]['schema'] = $schemaToSet;
	TE_session_write_close();
}
$connection=connectionManager::getConnection();
$currentSchema = isset($_SESSION['Connections'][USE_DATABASE_CONNECTION]['schema']) ? $_SESSION['Connections'][USE_DATABASE_CONNECTION]['schema'] : connectionManager::getConnection()->username;
$currentSchema = $currentSchema == "" ? $connection->username : $currentSchema;
echo(my_header("Set Default Schema",null));

echo <<<HERE
<div class="content_width">
	<p>
		<p>
			Current Default Schema: <b>$currentSchema</b>
		</p>
	</p>
</div>
<select name="setSchema"  class='general' size=10 style="width:300px">
HERE;

$schemas=$connection->getSchemaList();
foreach ($schemas as $schema)
	echo '<option value="' . $schema . '"' . ($schema == $currentSchema ? "selected" : "") . '> ' . $schema . '</option>';

echo <<<HERE
</select><br/>
HERE;
?>
