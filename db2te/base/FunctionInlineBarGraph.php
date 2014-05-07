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


function generatBar($dividend, $divisor, $spanID, $tableStyle = "", $flipColor = false, $withpercent = true)
{

	if($dividend < 0) {return;} //PWK do not draw graph if -1
	
	if($divisor)
		$left = (int)(($dividend/$divisor)*100);
	else
		$left = 100;
	$left = $left > 100 ? 100 : $left;
	$colorCoding = $flipColor ? 100 - $left : $left;

	$right = 100 - $left;
	$colour = "#00FF00";
	if($colorCoding <= 33)
	{
		$colour = "#00" . dechex(156+$colorCoding*3) ."00";
	}
	elseif($colorCoding < 66)
	{
		$colour = "#". (strlen(dechex(7.5*($colorCoding-33))) == 1 ? "0" . dechex(7.5*($colorCoding-33)) : dechex(7.5*($colorCoding-33))) . "FF00";
	}
	else
	{
		$colour = "#FF". (strlen(dechex(255 - (7.5*($colorCoding-66)))) == 1 ? "0" . dechex(255 - (7.5*($colorCoding-66))) : dechex(255 - (7.5*($colorCoding-66)))) . "00";
	}

	$toreturn = <<<BAR
	<table class="$spanID">
		<tr>
			<td>
				<table style="$tableStyle">
					<tr>
					  <td width="$left%" bgcolor="$colour" >

					  </td>
					  <td width="$right%" >
					  </td>
					</tr>
				</table>
			</td>
BAR;
	if($withpercent)
	{
			$toreturn .= "<td>&nbsp;$left%</td>";
	}
	return $toreturn . "</tr></table>";
}
