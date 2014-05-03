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

require_once("./config.php");
require_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeMenu.php");

?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
<link rel="apple-touch-icon-precomposed" href="images/TEicon.png"/>
<link rel="apple-touch-startup-image" href="images/TEicon.png" />
<link rel="apple-touch-icon" href="images/TEicon.png" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">

<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<meta http-equiv="Content-Style-Type" content="text/css; charset=UTF-8"/>
<script type="text/javascript">
var IS_TOUCH_SYSTEM = <?php echo getParameter("TOUCH_OVERRIDE", "('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) ||(navigator.userAgent.match(/iPad/i) != null)"); ?>;
</script>
<link rel="stylesheet" type="text/css" media="all" href="<?php echo CSS_BASE_FILE; ?>"/>

<?php
	echo "<title>" . connectionManager::titleString() . "</title>\n\n";
	include_once(PHP_INCLUDE_BASE_DIRECTORY . "HTMLEncodeJSList.php");
?>
<script type="text/javascript">
function checkDimensionLoad(dom,name) {
	if(dom==null) alert('failed to load dimension: '+name);
}
<?php
	// Load dimension Look for XML files that with '.xml' while ignoring case
	$fileInDir = scandir(TABLE_DEFINITION_DIRECTORY.'dimensions', 0);
	if (!$fileInDir)
		log_error("Cannot find dimension directory or files in directory: ".TABLE_DEFINITION_DIRECTORY.'dimensions',0);
	else
		foreach($fileInDir as $currentFile)
			if(preg_match('/^.*\.xml$/i', $currentFile )) 
				echo 'getDOMParsed ("tableDefinitions/dimensions/'.$currentFile.'",null,checkDimensionLoad,"'.$currentFile.'");';
?>

YAHOO.widget.Chart.SWFURL = "<?php echo JS_BASE_DIRECTORY; ?>/YUI/chart/assets/charts.swf";

var CLIENT_ACTIONS = $H();

YAHOO.widget.Chart.SWFURL = "<?php echo JS_BASE_DIRECTORY; ?>/YUI/chart/assets/charts.swf";

var TE_HOME_PAGE = (<?php
	$isTouchSystem = getParameter("TOUCH_OVERRIDE");
	if($isTouchSystem != null)
		$isTouchSystem = strtolower($isTouchSystem) == "true" ? true : false;
	else
		$isTouchSystem = @preg_match("/(iPhone|iPod|iPad)/i", $_SERVER['HTTP_USER_AGENT']) != 0;

	$useLayout = ( $isTouchSystem ? CUSTOM_TE_TOUCH_HOME_PAGE_LAYOUT : CUSTOM_TE_HOME_PAGE_LAYOUT );

	if(is_file(USER_PREFERENCES_DIRECTORY . CUSTOM_TE_HOME_PAGE_LAYOUT) && is_readable(USER_PREFERENCES_DIRECTORY . $useLayout))
		echo json_encode(JSONEncodeMenu::encodePageWindowFromFile(USER_PREFERENCES_DIRECTORY . $useLayout));
	else if(is_file(USER_PREFERENCES_DIRECTORY . "default/" . $useLayout) && is_readable(USER_PREFERENCES_DIRECTORY . "default/" . $useLayout))
		echo json_encode(JSONEncodeMenu::encodePageWindowFromFile(USER_PREFERENCES_DIRECTORY . "default/" . $useLayout));
?>);

Event.observe(window, 'load', function() {

	new windowStage('SuperStage', NO_TASK_BAR, 0, 0, 0, 0, NO_TITLE_BAR, NO_NAV_BAR, NO_TITLE_BAR_OPTIONS, WINDOW_IS_FULL);
	$('PageBody').insert(getStage('SuperStage').show());
	
	new windowStage('FloatingStage', NO_TASK_BAR, 0, 0, 0, 0, WINDOW_CONTROLS_INSIDE_OF_TITLE, NAV_BACK_BUTTON | NAV_FORWARD_BUTTON | NAV_RELOAD_BUTTON, TITLE_BAR_CLOSE_BUTTON, WINDOW_IS_SIZABLE);
	$('PageBody').insert(getStage('FloatingStage').show());

	var layout = (<?php 
			echo json_encode(JSONEncodeMenu::encodePageWindowFromFile(USER_PREFERENCES_DIRECTORY .( $isTouchSystem ? "default/TE_TOUCH_LAYOUT.xml" : "default/TE_CORE_LAYOUT.xml" ) ));
?>);
	
	loadNewPageLayout(layout);
	
	changeWorkArea();

	$('PageBody').observe('click', function() {
		if(!mouseIsOverContextBase) {
			if(visibleFloatingObject != null && AllowAutoClosingOfFloatingObject)
				visibleFloatingObject.close();
			AllowAutoClosingOfFloatingObject = true;
		}
	});
	if(IS_TOUCH_SYSTEM) {
		$('PageBody').observe('touchstart', function(event) {
                if(!mouseIsOverContextBase) {
                        if(visibleFloatingObject != null && AllowAutoClosingOfFloatingObject)
                                visibleFloatingObject.close();
                        AllowAutoClosingOfFloatingObject = true;
                }
        });
		document.observe('touchmove', function(event) {
			event.preventDefault();
		});
		document.observe('touchend', function(event) {
			CIRCLE_MENU_CLOSE(event, true);
			event.preventDefault();
		});
	}
	$('PageBody').observe('mouseup', function(event) {
		Releaseme();
		if(IS_TOUCH_SYSTEM)
			CIRCLE_MENU_CLOSE(event, true);
		$(GENERAL_BLANK_POPUP.elementUniqueID + "_Container").setStyle({"display": "none"});
	});

	var GENERAL_BLANK_POPUP = new floatingPanel('GENERAL_BLANK_POPUP', 'RAW', 'Nothing to See', null, true, false, null, 350, 10);
	GENERAL_BLANK_POPUP.draw();
	
	browserWindowSize();

	OpenBlankWindow("DefaultStage");
	
	if(Prototype.Browser.IE && SHOW_IE_PERFORMANCE_WARNING)
		openModalAlert("<?php echo PHP_INCLUDE_BASE_DIRECTORY . BASE_LANGUAGE_DIRECTORY .  TE_LANGUAGE . "/index_IE_warning.html";?>"
						, "URL", null, null);
});

generalKeyCommands = function(event) {
	if(event.keyCode == Event.KEY_ESC)
		closeOpenFloatingObject();
};

stopPropagation = function(event){
	Event.stop(event);
};

<?php
//Used to stop users from accidentally leaving the page and losing all there work. 
if(ENABLE_CONFIRM_LEAVE_VIA_BROWSER_NAVIGATION) {
	echo '
window.onbeforeunload = function confirmLeaveVIAbrowserNavigation() {
	return "All open pages within the Technology Explorer will be lost if you leave the page.";
};
';
}
?>
window.onunload = function soLongAndThanksForAllTheFish() {
	var aStage = getStage("SuperStage");
	if(aStage != null) aStage.destroy();
	aStage = getStage("FloatingStage");
	if(aStage != null) aStage.destroy();
};
//On window scroll move scroll bars back to the top. Stop accidental scrolling of the entire application.
window.onscroll = function (e) {
	document.documentElement.scrollTop = 0;
	document.documentElement.scrollLeft = 0;
	return false;
};

function bodyMove(event) {
	event.preventDefault();
}

</script>
</head>

<body id="PageBody" style="width:100%;height:100%;display:block;" onkeypress="generalKeyCommands(event);" onResize="browserWindowSize()">
<?php
	$agent = $_SERVER['HTTP_USER_AGENT'];
	if(!empty($agent) and preg_match("~Mozilla/[^ ]+ \((iPhone|iPodi|iPad); U; CPU [^;]+ Mac OS X; [^)]+\) AppleWebKit/[^ ]+ \(KHTML, like Gecko\) Version/[^ ]+ Mobile/[^ ]+ Safari/[^ ]+~",$agent,$match))
		if(is_file(PHP_INCLUDE_BASE_DIRECTORY . BASE_LANGUAGE_DIRECTORY .  TE_LANGUAGE . "/index_error.html"))
			readfile(PHP_INCLUDE_BASE_DIRECTORY . BASE_LANGUAGE_DIRECTORY .  TE_LANGUAGE . "/index_error.html");
?>
</body>
</html>