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

$time = getParameter('time', 300);
$donemsg = getParameter('donemsg', "All done");
$msg = getParameter('msg', "Please run workload for 3 minute....");



?>

<script type="text/javascript">
getActiveWindow('FloatingStage').setHeight(100);
getActiveWindow('FloatingStage').moveLeft(1);
var countDownTime = <?php echo $time; ?>;
new PeriodicalExecuter(function(pe) {
if($("<?php echo CALLING_PAGE; ?>_waitingArea") == null) pe.stop();
if(countDownTime == 0)
{
	pe.stop();
	$("<?php echo CALLING_PAGE; ?>_waitingArea").update("<?php echo $donemsg; ?>");
}
else
{
	if($("<?php echo CALLING_PAGE; ?>_loadingTime") == null) 
	{	
		pe.stop();
		return;
	}
	$("<?php echo CALLING_PAGE; ?>_loadingTime").update( Math.floor(countDownTime/60) + "m " + countDownTime%60 + "s");
 	countDownTime--;
 }
}, 1);

</script>
<div id="title">Waiting</div>
<div id="<?php echo CALLING_PAGE; ?>_waitingArea" style="background-color:#F0F0F0;">
<table width='100%' height='100%'  cellspacing='0' cellpadding='0' align='center' valign='center'>
	<tr height="20px">
		<td align='center'><img style='float:none;' src='images/loadingpage_small.gif'/></td>
	</tr>
	<tr height="20px">
		<td id="<?php echo CALLING_PAGE; ?>_loadingTime" align="center">
			<?php echo floor($time/60) + "m " + $time%60 + "s"; ?>
		</td>
	</tr>
	<tr>
		<td>
<?php echo $msg; ?>
		</td>
	</tr>
</table>
</div>
