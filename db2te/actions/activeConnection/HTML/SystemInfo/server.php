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

$stageID = CALLING_STAGE;
$windowID = CALLING_WINDOW;
$panelID = CALLING_PANEL;
$pageID = CALLING_PAGE;
$date = date('l jS \of F Y h:i:s A');
	echo <<<HERE
	
<script type="text/javascript">

createContextMenu('{$pageID}_USERMENU', [
	{
		nodeType: "LEAF",
		elementID : "DATETIME",
		elementValue : "Last updated: $date",
		elementAction : "",
		elementSubNodes : null,
		elementSubNodeDirection : HORIZONTAL
	}

], HORIZONTAL, '$stageID', '$windowID', '$panelID');

</script>

HERE;
		
echo '
<table>
	<tr>
		<td valign="top">';
echo connectionManager::getConnection()->getShowPhysicalServerDetails();
echo '
		</td>
	</tr>
</table>';
?>