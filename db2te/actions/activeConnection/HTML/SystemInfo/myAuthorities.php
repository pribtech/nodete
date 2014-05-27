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
TE_check_session_timeout();

require_once(PHP_INCLUDE_BASE_DIRECTORY . 'ArrayEncodeTableDefinition.php');

$db2ConnectedUser = connectionManager::getConnection()->username;
 
$myAuthoritiesSQL = <<<SELECTSERV
SELECT AUTHORITY FROM TABLE (select authority from table(sysproc.auth_list_authorities_for_authid( CURRENT USER,'U')) where d_user = 'Y' or d_group = 'Y' or d_public = 'Y' or role_user = 'Y' or role_group = 'Y' or role_public = 'Y' or d_role = 'Y' ) AS AUTH_SUMMARY 
SELECTSERV;
	
$myAuthorities = array();

$myAuthoritiesResult = connectionManager::getNewStatement($myAuthoritiesSQL, FALSE, FALSE);
if ($myAuthoritiesResult->execSuccessful())
{
	while($row = $myAuthoritiesResult->fetchAssocRow())
	{
		$myAuthorities[] = $row['AUTHORITY'];
	}
}

$notUsed = false;

$fileMask = ArrayEncodeTableDefinition::ParseTableMask(new XMLNode(null, file_get_contents(TABLE_DEFINITION_DIRECTORY . 'masks/authoritiesMask.xml')));

echo '
<table>
	<tr>
		<td valign="top">';

$contentInfo = "";
foreach($myAuthorities as $autoritie)
{
	$contentInfo .= makeDisplayContent($autoritie, (isset($fileMask[$autoritie]) ? $fileMask[$autoritie]['mask'] : ""));
}

echo makeDisplayGroup('Authorities for ' . $db2ConnectedUser, $contentInfo);

echo '
		</td>
	</tr>
</table>';

?>

