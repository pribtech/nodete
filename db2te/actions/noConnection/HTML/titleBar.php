<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2007 All rights reserved.
 *
 *  Update: Peter Prib 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009)  2013 All rights reserved.
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
		echo "createContextMenu('" . CALLING_PAGE . "_generatedLeftMenu',  '" . getParameter('menuFolder', MAIN_MENU_ROOT_DIRECTORY)  . "', HORIZONTAL, '" . CALLING_STAGE . "', '" . CALLING_WINDOW . "', '" . CALLING_PANEL . "');\n";
		echo "GLOBAL_CONTEXT.setContextMenu('" . getParameter('menuFolder', MAIN_MENU_ROOT_DIRECTORY) . "');" ;
		echo "createContextMenu('" . CALLING_PAGE . "_generatedRightMenu', '" . getParameter('rightMenuFolder', MAIN_RIGHT_MENU_ROOT_DIRECTORY) . "', HORIZONTAL, '" . CALLING_STAGE . "', '" . CALLING_WINDOW . "', '" . CALLING_PANEL . "');\n";
	?>
</script>

<table class="contextRootBase" cellpadding="0" cellspacing="0" >
	<tbody>
		<tr>
			<td>
				<table  cellpadding="0" cellspacing="0">
					<tr>
						<td id="<?php echo CALLING_PAGE ?>_generatedLeftMenu">
						</td>
					</tr>
				</table>
			</td>
			<td id="<?php echo CALLING_PAGE ?>_generatedRightMenu" align="right">
			</td>
		</tr>
	</tbody>
</table>

