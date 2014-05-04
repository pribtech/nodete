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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "ssh.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "FunctionInlineBarGraph.php");


$host = "";
$user = "";
$password = "";

@session_start();
if($_SESSION['Connections'][USE_DATABASE_CONNECTION] != null)
{
	$host = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['hostname'];
	$user = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['username'];
	$password = $_SESSION['Connections'][USE_DATABASE_CONNECTION]['password'];
}
session_write_close();


$sshReturnData = runSshScript($host, $user, $password, array('db2instance -list'), 'SHELL');

  $toReturn = array();
  if($sshReturnData['returnCode'] == true)
  {
  	$returnData_Members = array();
  	$returnData_Hosts = array();
  	$maxPartNum = 0;
  	
  	$returnText = $sshReturnData['returnValue']['outputs'][0];
  	
  	$returnText = preg_split("/HOSTNAME\h+STATE\h+INSTANCE_STOPPED\h+ALERT/", $returnText );
  	
  	$memberInformation = $returnText[0];
  	
  	$memberInformation = preg_replace('/ID\h+TYPE\h+STATE\h+HOME_HOST\h+CURRENT_HOST\h+ALERT\h+PARTITION_NUMBER\h+LOGICAL_PORT\h+NETNAME/', "", $memberInformation);
  	$memberInformation = preg_replace('/[\-]+\h+[\-]+\h+[\-]+\h+[\-]+\h+[\-]+\h+[\-]+\h+[\-]+\h+[\-]+\h+[\-]+/', "", $memberInformation);
  	$memberInformation = trim($memberInformation);
  	
  	
  	$hostInformation = $returnText[1];
  	$hostInformation = preg_replace("/[\-]+\h+[\-]+\h+[\-]+\h+[\-]+/", "", $hostInformation );
  	$hostInformation = trim($hostInformation);
  	
	$returnTableData = array();	

	$returnData = array();

	$MemberNumber = 0;

	$memberInformation = explode("\n", $memberInformation);
	foreach($memberInformation as $row)
	{

		$row = trim($row);
		$matches = array(); //\h+Appid:(\w+)\s*(.*)\h+Probe:(\w+)\s*(ADM\w*)\s*([.\n]*)
		preg_match('/(\S+)\h+(\S+)\h+(\S+)\h+(\S+)\h+(\S+)\h+(\S+)\h+(\S+)\h+(\S+)\h+(\S+)/', $row, $matches); 
		if(count($matches) == 0)
			continue;

		$returnData_Members[] = array(
				$matches[1],
				$matches[4],
				$matches[5],
				$matches[2],
				$matches[3],
				$matches[6],
				$matches[7],
				$matches[8],
				$matches[9]
			);
	}
	$hostInformation = explode("\n", $hostInformation);
	foreach($hostInformation as $row)
	{
		$row = trim($row);
		$matches = array(); //\h+Appid:(\w+)\s*(.*)\h+Probe:(\w+)\s*(ADM\w*)\s*([.\n]*)
		preg_match('/(\S+)\h+(\S+)\h+(\S+)\h+(\S+)/', $row, $matches); 
		if(count($matches) == 0)
			continue;
			
		$returnData_Hosts[] = array(
				$matches[1],
				$matches[2],
				$matches[3],
				$matches[4]
			);
	}
	$returnObject = array();
	
	$returnObject['returnCode'] = 'true';

	$returnObject['returnValue'] = array();
	

	$returnObject['returnValue']['host'] = array();
	$returnObject['returnValue']['host']['rowsReturned'] = count($returnData_Hosts);
	$returnObject['returnValue']['host']['data'] = $returnData_Hosts;

	$returnObject['returnValue']['member'] = array();
	$returnObject['returnValue']['member']['rowsReturned'] = count($returnData_Members);
	$returnObject['returnValue']['member']['data'] = $returnData_Members;
	

  }
  else
  {
  	$returnObject['returnCode'] = 'false';
	$returnObject['returnValue'] = 'Could not connect';
  }
  echo json_encode($returnObject);



