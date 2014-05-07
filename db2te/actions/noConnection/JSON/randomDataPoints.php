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

$valueArray = array();
$filterLevel = 5;

if(!isset($_SESSION['graphCount']))
{
	$_SESSION['graphCount'] = 0;
}

$j = $_SESSION['graphCount'];

$_SESSION['graphCount']++;

if(!isset($_SESSION['time']))
{
	for($i=0; $i<38; $i++)
	{
		$valueArray[] = floor(rand(1, 1000));
	}
	
}
else 
{
	$time = json_decode($_SESSION['time']);
	if(is_array($time))
	{
		$valueArray = $time;
	}
	else 
	{
		for($i=0; $i<38; $i++)
		{
			$valueArray[] = floor(rand(1, 1000));
		}
	}
}

array_shift($valueArray);

array_push($valueArray, floor(rand(1, 1000)));


//$valueArray[] = floor(rand(1, 1000));

header('Content-type: application/x-json');
header("Cache-Control: no-cache, must-revalidate");


echo '[';
	for($i=3; $i<=33; $i++)
	{
		echo '{"Name":' . ($j++) . ', "Value":' . ( ( ($valueArray[$i-1]/2) + $valueArray[$i] + ($valueArray[$i+1]/2) )/2 ) . ', "Raw": ' . $valueArray[$i] . ' }';
		
		if($i != 33)
			echo ",";
	}
	

	echo ']';


$_SESSION['time'] = json_encode($valueArray);

?>
