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
?>
<script type="text/javascript">
	<?php 
		echo "MAIN_MENU_ROOT_DIRECTORY = '" . getParameter('menuFolder', MAIN_MENU_ROOT_DIRECTORY) . "';\n";
		echo "GLOBAL_CONTEXT.setContextMenu(MAIN_MENU_ROOT_DIRECTORY);\n" ;
		echo "new circleMenu('ROOT_MAIN_MENU_ITEM_333', 'ROOT_MAIN_MENU_ITEM_333', false, MAIN_MENU_ROOT_DIRECTORY, VERTICAL, false, null, null, '" . CALLING_STAGE . "', '" . CALLING_WINDOW . "', '" . CALLING_PANEL . "', null,null);\n";
	?>
</script>

<table style='padding-top:4px;font-size:18px;height:100%;width:100%;background:-webkit-gradient(linear, left top, left bottom, from(#aaa), to(#fff), color-stop(0.3, #fff));' cellpadding="0" cellspacing="0" >
	<tbody>
		<tr>
			<td id="<?php echo CALLING_PAGE ?>_generatedLeftMenu">
				<img id="ROOT_MAIN_MENU_ITEM_333" src="./images/circleMenu/menuStart.png" onmousedown="allContextWindows.get('ROOT_MAIN_MENU_ITEM_333').open(event);" ontouchstart="allContextWindows.get('ROOT_MAIN_MENU_ITEM_333').open(event);" onmouseup="CIRCLE_MENU_CLOSE(event, true)" ontouchend="CIRCLE_MENU_CLOSE(event, true);" onmousemove="CIRCLE_MENU_MOVE(event)" ontouchmove="CIRCLE_MENU_MOVE(event)"/>
			</td>
		</tr>
	</tbody>
</table>

