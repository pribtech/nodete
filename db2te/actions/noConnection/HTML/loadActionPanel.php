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

	include_once(PHP_INCLUDE_BASE_DIRECTORY . "ArrayEncodeActionPanel.php");
	
	$panelID = CALLING_PANEL;
	$windowID = CALLING_WINDOW;
	$stageID = CALLING_STAGE;
	$pageID = CALLING_PAGE;

	$actionLocalConstant = getParameter('actionLocalConstant', "null");
	$actionSharedResultSets = getParameter('actionSharedResultSets', "null");
	$actionFileName = getParameter('actionFile', "");
	
	$actionPanel = ArrayEncodeActionPanel::fromFile($actionFileName);
	
	if(is_array($actionPanel))
	{
		echo "<script type=\"text/javascript\">\n";
		
		echo "var parentPanel = getPanel('$stageID', '$windowID', '$panelID');";
		
		echo "parentPanel.pageState = [];";
		
		foreach ($actionPanel['tasks'] as $action) {
			if($action['action'] != '""')
			{
				echo "parentPanel.pageState['{$action['id']}'] = new actionScript('{$action['id']}', " . json_encode($action['action']) . ", $actionLocalConstant, '$stageID', '$windowID', '$panelID', '$pageID', '{$pageID}_ACTION_console', $actionSharedResultSets);\n";
			}
		}
		echo "</script>\n";
	}
	else
		echo $actionPanel;

?>


<script type="text/javascript">

	<?php echo $pageID; ?>_CallBack = function(returnStack) {
		
		$('<?php echo $pageID; ?>_ActionPanel_actions').update(returnStack.localVariables);
		
	};

	<?php echo $pageID; ?>_ActionCall = function(description, actionID, title) {
		
		$('<?php echo $pageID; ?>_ActionPanel_info').update(decodeURIComponent(description));
		$('<?php echo $pageID; ?>_ActionPanel_actionTitle').update(title);
		if(actionID != null)
		{
<?php
	if($actionPanel['flow'])
	{
		echo <<<HERE
			var content = $('{$pageID}_ActionPanel_actions').innerHTML;
			$('{$pageID}_ActionPanel_actions').update("<table width='100%' height='100%'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr></table>");
			getPanel('$stageID', '$windowID', '$panelID').pageState[actionID].callAction(null, null, '{$pageID}_CallBack', content);
HERE;
	}
	else 
	{
		echo <<<HERE
			getPanel('$stageID', '$windowID', '$panelID').pageState[actionID].callAction(null, null, null, null);
HERE;
	}
?>
		}
	};

	var layout = ({
							type:"splitPane",
							direction:"h",
							splitPercent:0.75,
					         "maxSize":null,
					         "allowResize":true,
							panelA: {
														type:"panel",
														name:"TUTORIAL_TEXT_PANEL",
														PrimaryContainer:true,
														ContentType:"RAW",
														data:<?php 
$text = <<<HERE
<div id="title">Action Panel</div>
<table style="height:100%;width:100%;padding:5px;" cellpadding='0' cellspacing='0' align='left'>
	<tbody>
		<tr>
			<td style="width:200px;" valign="top" id='{$pageID}_ActionPanel_actions'>
			<span><h1>Actions:</h1></span>
<ul class="blockedList">
HERE;
	$i = 1; 
	$actionFirst = null;
	$baseText = "";
	foreach ($actionPanel['tasks'] as $action) {
		$actionFirst = $actionFirst === null ? $action : $actionFirst;
		$action['description'] = rawurlencode($action['description']);
		$text .= "<li onmouseover=\"{$pageID}_ActionCall(decodeURIComponent('{$action['description']}'), null, '$i: {$action['name']}');\"><button style='width:100%;text-align:left;' onClick=\"{$pageID}_ActionCall('{$action['description']}','{$action['id']}', '$i: {$action['name']}');\">{$action['name']}</button></li>\n";
		$i++;
	}
if($actionFirst != null)
{
	$baseText = htmlspecialchars($actionFirst['description']);
}
$text .= <<<HERE
</ul>
			</td>
			<td style="width:5px;"></td>
			<td>
				<table style="height:100%;width:100%;" cellpadding='0' cellspacing='0' align='left'>
					<tbody>
						<tr>
							<td style="height:20px;" valign="top">
								<table style="width:100%;" cellpadding='0' cellspacing='0' ><tr><td><span><h1 id='{$pageID}_ActionPanel_actionTitle'>1: {$actionFirst['name']}</h1></span><td><td style='width:20px;'>
HERE;
if(ALLOW_DISPLAY_OF_XML)
{
	$text .= "<a onClick=\"openURLonDefaultStageInIframe( DB2MC_SERVER + '$actionFileName');\"><b>XML</b></a>";
}		
$text .= <<<HERE
</td></tr></table>
							</td>
						</tr>
						<tr>
							<td valign="top">
								<div id='{$pageID}_ActionPanel_info'>{$baseText}</div>
							</td>
						</tr>
					</tbody>
				</table>
			</td>
		</tr>
	</tbody>
</table>

HERE;
echo json_encode($text); ?>
							},
							panelB: {
										type                :"stage",
										name                :"<?php echo $actionPanel['stage']; ?>",
										HasMenuBarContainer : TOP_TAB_TASK_BAR, 
										top                 : 0, 
										botton              : 0, 
										left                : 0,
										right               : 0,
										titleBarType        : NO_TITLE_BAR,
										windowOptionType    : NO_NAV_BAR, 
										windowControlTypes  : NO_TITLE_BAR_OPTIONS,
										sizable             : WINDOW_IS_FULL
							}		
			});

	getWindow('<?php echo $stageID; ?>','<?php echo $windowID; ?>').WindowContainers.get('<?php echo $panelID; ?>').loadLayout(layout);

	getWindow('<?php echo $stageID; ?>','<?php echo $windowID; ?>').WindowContainers.get('<?php echo $panelID; ?>').hideAddressBar();
		
	var layout = ({
	target      : "_blank",
	raiseToTop  :"",
	windowStage :"<?php echo $actionPanel['stage']; ?>",
	windowType  : CAN_NOT_CLOSE,
	content     : {
									type:"panel",
									name:"actionConsolePanel",
									PrimaryContainer:true,
									ContentType:"DATA",
									ContentType:"RAW",
									data:"<div id='title'>Console</div><span><h1>Action script feed back:</h1></span><br/><div class='SQL_RESULTS_THIS_RUN'><pre><code id='<?php echo $pageID; ?>_ACTION_console'></code></pre></div>"
								}
	});
	
	loadNewPageLayout(layout);

	
</script>